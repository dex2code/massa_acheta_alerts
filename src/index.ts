import {
  debugMode, dieAfterMs,
  tgOwner, tgChat, tgToken, tgCourierDelayMs,
  exchangeDelayMs, exchangeTresholdPercent,
  githubDelayMs, githubReleasePath,
  w3Client,
  graphTimeOrigin,
  chainLookupDelayMs,
  operationTresholdValueUSDT,
  opExplorerURL,
  rollPrice,
} from "./consts";

import {
  IMassaBlock,
  IMassaPrice,
} from "./types";

import {
  IGetGraphInterval,
  IRollBuyOpType,
  IRollSellOpType,
  ITransactionOpType,
} from "@massalabs/massa-web3";

import {
  getMassaPrice,
  getMassaRelease,
} from "./tools";


import TelegramBot from 'node-telegram-bot-api';
const tgBot = new TelegramBot(tgToken, {polling: false});

console.log(`*** Massa Acheta Alerts started at ${new Date()}`);
tgBot.sendMessage(tgOwner, `*** Massa Acheta Alerts started at ${new Date()}`);


/** Global vars section */
var tgMessages: string[] = new Array();

var massaRelease: string;
(async function () {
  const tMassaRelease = await getMassaRelease();
  if (tMassaRelease) {
    massaRelease = tMassaRelease;
    console.log(`(${Date.now()}) -- [achetaAlerts] Set massaRelease = '${massaRelease}'`);
  } else {
    console.error(`(${Date.now()}) -- [achetaAlerts] Cannot set massaRelease - got '${tMassaRelease}' value`);
    throw new Error(`Cannot set massaRelease`);
  }
})();

var massaPrice = {
  tresholdPercent: exchangeTresholdPercent,
} as IMassaPrice;
(async function () {
  const tMassaPrice = await getMassaPrice();
  if (tMassaPrice) {
    massaPrice.currentValue = tMassaPrice;
    massaPrice.fixedValue = tMassaPrice;
    console.log(`(${Date.now()}) -- [achetaAlerts] Set massaPrice = '${massaPrice.fixedValue}'`);
  } else {
    console.error(`(${Date.now()}) -- [achetaAlerts] Cannot set massaPrice - got '${tMassaPrice}' value`);
    throw new Error(`Cannot set massaPrice`);
  }
})();

var graphStart: number;
var graphEnd: number;

var massaBlocks: string[] = new Array();
var massaOperations: string[] = new Array();
/** End of Global vars section */


/** TGCourier */
setInterval(async function () {
  if (debugMode) console.debug(`(${Date.now()}) -- [TGCourier] Interval run`);

  const tgMessage = tgMessages.shift();
  if (tgMessage === undefined) {
    if (debugMode) console.debug(`(${Date.now()}) -- [TGCourier] No messages in Array`);
    return;
  }

  console.log(`(${Date.now()}) -- [TGCourier] Found another message in tgQueue, trying to deliver:`);
  if (debugMode) console.debug(tgMessage);

  await tgBot.sendMessage(tgChat, tgMessage, { disable_web_page_preview: true })
  .then(response => {
    console.log(`(${Date.now()}) -- [TGCourier] Successfully delivered message: ${response.message_id}`);
  })
  .catch(err => {
    console.error(`(${Date.now()}) -- [TGCourier] Error:`);
    console.error(err);
  });

}, tgCourierDelayMs);


/** MassaReleaseUpdater */
setInterval(async function () {
  if (debugMode) console.debug(`(${Date.now()}) -- [MassaReleaseUpdater] Interval run`);

  await getMassaRelease()
  .then(githubRelease => {
    if (!githubRelease) {
      console.error(`(${Date.now()}) -- [MassaReleaseUpdater] Got empty or undefined value from getMassaRelease()`);
      return;
    }

    if (massaRelease === undefined) {
      console.log(`(${Date.now()}) -- [MassaReleaseUpdater] A first run - set massaRelease ('${githubRelease}')`);
      massaRelease = githubRelease;
    }

    if (githubRelease != massaRelease) {
      console.log(`(${Date.now()}) -- [MassaReleaseUpdater] New MASSA Release found ( '${massaRelease}' -> '${githubRelease}' )`);
      massaRelease = githubRelease;
      tgMessages.push(` 💾 A new MASSA Release available: ${massaRelease}.\n 📥 ${githubReleasePath}${massaRelease}`);
    } else {
      console.log(`(${Date.now()}) -- [MassaReleaseUpdater] No new MASSA releases found: ('${githubRelease}' == '${massaRelease}')`);
    }    
  })
  .catch(err => {
    console.error(`(${Date.now()}) -- [MassaReleaseUpdater] Error:`);
    console.error(err);
    tgBot.sendMessage(tgOwner, `[MassaReleaseUpdater] Error: ${err.message}`);
  });
}, githubDelayMs);


/** MassaPriceUpdater */
setInterval(async function () {
  if (debugMode) console.debug(`(${Date.now()}) -- [MassaPriceUpdater] Interval run`);

  await getMassaPrice()
  .then(exchangePrice => {
    if (!exchangePrice) {
      console.error(`(${Date.now()}) -- [MassaPriceUpdater] Got empty or undefined value from getMassaPrice()`);
      return;
    }
    massaPrice.currentValue = exchangePrice;

    if (massaPrice.fixedValue === undefined) {
      console.log(`(${Date.now()}) -- [MasPriceUpdater] A first run - set fixedValue (${massaPrice.currentValue})`)
      massaPrice.fixedValue = massaPrice.currentValue;
    }

    const massaPriceDiff = massaPrice.currentValue - massaPrice.fixedValue;
    if (Math.abs(massaPriceDiff) > (massaPrice.fixedValue / 100 * massaPrice.tresholdPercent)) {
      console.log(`(${Date.now()}) -- [MasPriceUpdater] Threshold exceeded: (${massaPrice.fixedValue} -> ${massaPrice.currentValue})`);
      const massaPriceDiffPerscent = (Math.abs(massaPriceDiff) / massaPrice.fixedValue * 100).toFixed(2);
      if (massaPriceDiff >= 0) {
        tgMessages.push(` 🟢 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT\n➕ ${massaPriceDiffPerscent} %`);
      } else {
        tgMessages.push(` 🔴 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT\n➖ ${massaPriceDiffPerscent} %`);
      }
      massaPrice.fixedValue = massaPrice.currentValue;
    } else {
      console.log(`(${Date.now()}) -- [MasPriceUpdater] Treshold not exceeded (${massaPrice.fixedValue} -> ${massaPrice.currentValue})`)
    }  
  })
  .catch(err => {
    console.error(`(${Date.now()}) -- [MasPriceUpdater] Error:`);
    console.error(err);
    tgBot.sendMessage(tgOwner, `[MasPriceUpdater] Error: ${err.message}`);
  });
}, exchangeDelayMs);


/** graphInterval */
setInterval(() => {
  if (graphStart === undefined) {
    graphStart = graphTimeOrigin;
    console.log(`(${Date.now()}) -- [graphInterval] A first run - set graphStart (${graphStart})`);
  } else {
    graphStart = graphEnd + 1;
  }
  graphEnd = graphStart + chainLookupDelayMs;

  if (debugMode) console.debug(`(${Date.now()}) -- [graphInterval] Check interval: ${graphStart} -- ${graphEnd}`);

  w3Client.getGraphInterval({
    start: graphStart,
    end: graphEnd
  } as IGetGraphInterval)
  .then(blocks => {
    blocks.forEach(block => {
      if (
        block.id &&
        block.is_final &&
        !block.is_in_blockclique &&
        !block.is_stale
      ) {
        if (debugMode) console.debug(`(${Date.now()}) -- [graphInterval] Found new block: ${block.id}`);
        massaBlocks.push(block.id);
      } else {
        console.error(`(${Date.now()}) -- [graphInterval] Undefined block ID or not final block: ${block.id}`);
      }
    });
  })
  .catch(err => {
    console.error(`(${Date.now()}) -- [graphInterval] Error:`);
    console.error(err);
  });
}, chainLookupDelayMs);


/** massaBlockLookup */
setInterval(async function () {
  const massaBlockId = massaBlocks.shift();
  if (massaBlockId === undefined) {
    if (debugMode) console.debug(`(${Date.now()}) -- [massaBlockLookup] No blocks in Array`);
    return;
  }
  if (debugMode) console.debug(`(${Date.now()}) -- [massaBlockLookup] found block ${massaBlockId}`);

  await w3Client.getBlocks([massaBlockId])
  .then(blocks => {
    blocks.forEach(block => {
      const tBlock = block as IMassaBlock;

      if (debugMode) console.debug(`(${Date.now()}) -- [massaBlockLookup] Operating block ${tBlock.id}`);

      if (
        tBlock.id &&
        tBlock.content &&
        tBlock.content.block &&
        tBlock.content.is_final &&
        !tBlock.content.is_candidate &&
        !tBlock.content.is_discarded &&
        !tBlock.content.is_in_blockclique
      ) {
        const operations = tBlock.content.block.operations;
        operations.forEach(operation => {
          if (debugMode) console.debug(`(${Date.now()}) -- [massaBlockLookup] Found operation ${operation}`);
          massaOperations.push(operation);
        });
      } else {
        console.warn(`(${Date.now()}) -- [massaBlockLookup] Block ${tBlock.id} is not final`);
      }
    });
  })
  .catch(err => {
    console.error(`(${Date.now()}) -- [massaBlockLookup] Error:`);
    console.error(err);
  });
}, chainLookupDelayMs);


/** massaOperations */
setInterval(async function () {

  const opSlice = massaOperations.splice(0, massaOperations.length);
  await w3Client.getOperations(opSlice)
  .then(operations => {
    operations.forEach(operation => {
      if (
        operation.id &&
        operation.is_operation_final &&
        operation.op_exec_status &&
        !operation.in_pool &&
        operation.operation.content.op
      ) {
        if (debugMode) console.debug(`(${Date.now()}) -- [massaOperations] Operating ${operation.id}`);
        Object.keys(operation.operation.content.op).forEach(opType => {
          switch (opType) {

            case "Transaction": {
              const tOperation = operation.operation.content.op as ITransactionOpType;

              const operationValueUSDT = Math.round(
                parseFloat(tOperation.Transaction.amount) * massaPrice.currentValue
              );

              if (operationValueUSDT >= operationTresholdValueUSDT) {
                const tAmount = Math.round(
                  parseFloat(tOperation.Transaction.amount)
                );
                console.log(
                  `(${Date.now()}) -- [massaOperations] ${operation.id} (${opType}): ` +
                  `${operation.operation.content_creator_address} -> ${tOperation.Transaction.recipient_address} ` +
                  `(${tOperation.Transaction.amount} MAS -- ${operationValueUSDT} USDT)`
                );
                tgMessages.push(
                  ` 🐳 🐳 🐳   Whale Alert   🐳 🐳 🐳\n\n` +
                  ` 💸 ${tAmount} MAS ( ${operationValueUSDT} USDT ) transferred!\n\n` +
                  `${opExplorerURL}${operation.id}`
                );
              }
              break;
            }

            case "RollBuy": {
              const tOperation = operation.operation.content.op as IRollBuyOpType;

              const operationValueUSDT = Math.round(
                tOperation.RollBuy.roll_count * rollPrice * massaPrice.currentValue
              );

              if (operationValueUSDT >= operationTresholdValueUSDT) {
                console.log(
                  `(${Date.now()}) -- [massaOperations] ${operation.id} (${opType}): ` +
                  `${operation.operation.content_creator_address} ${tOperation.RollBuy.roll_count} Rolls`
                );
                tgMessages.push(
                  ` 🐳 🐳 🐳   Whale Alert   🐳 🐳 🐳\n\n` +
                  ` 🧻 ${tOperation.RollBuy.roll_count} Rolls ( ${operationValueUSDT} USDT ) have just been bought!\n\n` +
                  `${opExplorerURL}${operation.id}`
                );
              }
              break;
            }

            case "RollSell": {
              const tOperation = operation.operation.content.op as IRollSellOpType;

              const operationValueUSDT = Math.round(
                tOperation.RollSell.roll_count * rollPrice * massaPrice.currentValue
              );

              if (operationValueUSDT >= operationTresholdValueUSDT) {
                console.log(
                  `(${Date.now()}) -- [massaOperations] ${operation.id} (${opType}): ` +
                  `${operation.operation.content_creator_address} ${tOperation.RollSell.roll_count} Rolls`
                );
                tgMessages.push(
                  ` 🐳 🐳 🐳   Whale Alert   🐳 🐳 🐳\n\n` +
                  ` 🧻 ${tOperation.RollSell.roll_count} Rolls ( ${operationValueUSDT} USDT ) have just been sold!\n\n` +
                  `${opExplorerURL}${operation.id}`
                );
              }
              break;
            }

            default: {
              console.warn(`(${Date.now()}) -- [massaOperations] Unknown type '${opType}' in ${operation.id}`);
              break;
            }

          }
        });
        
      } else {
        console.warn(`(${Date.now()}) -- [massaOperations] Operation ${operation.id} is undefined or not final`);
      }
    })
  })
  .catch(err => {
    console.error(`(${Date.now()}) -- [massaOperations] Error:`);
    console.error(err);
  });
}, chainLookupDelayMs);


setInterval(async function () {
  return process.exit(0);
}, dieAfterMs);