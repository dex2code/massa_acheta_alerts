console.log(`*** Massa Acheta Alerts started at ${new Date()}`);

import {
  debugMode,
  tgCourierDelayMs,
  exchangeDelayMs, exchangeTresholdPercent,
  githubDelayMs, githubReleasePath,
  w3Client,
  graphIntervalMs, graphTimeOrigin,
  blockLookupDelayMs,
  operationLookupDelayMs
} from "./consts";

import {
  IMassaBlock,
  IMassaPrice
} from "./types";

import {
  IGetGraphInterval
} from "@massalabs/massa-web3";

import {
  sendTgMessage, getMassaPrice,
  getMassaRelease
} from "./tools";


/** Global vars section */
var tgMessages: string[] = new Array();

var massaRelease: string;

var massaPrice = {
  tresholdPercent: exchangeTresholdPercent,
} as IMassaPrice;

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
  console.log(tgMessage);

  await sendTgMessage(tgMessage)
  .then(tgResult => {
    tgResult?
      console.log(`(${Date.now()}) -- [TGCourier] Sent message successfully`) :
      console.log(`(${Date.now()}) -- [TGCourier] Error sending message`);
  })
  .catch(err => {
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
    console.error(err);
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
        tgMessages.push(` 🟢 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT ( ➕${massaPriceDiffPerscent} % )`);
      } else {
        tgMessages.push(` 🔴 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT ( ➖${massaPriceDiffPerscent} % )`);
      }
      massaPrice.fixedValue = massaPrice.currentValue;
    } else {
      console.log(`(${Date.now()}) -- [MasPriceUpdater] Treshold not exceeded (${massaPrice.fixedValue} -> ${massaPrice.currentValue})`)
    }  
  })
  .catch(err => {
    console.error(err);
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
  graphEnd = graphStart + graphIntervalMs;

  if (debugMode) console.debug(`(${Date.now()}) -- [graphInterval] Check interval: ${graphStart} -- ${graphEnd}`);

  w3Client.getGraphInterval({
    start: graphStart,
    end: graphEnd
  } as IGetGraphInterval)
  .then(blocks => {
    blocks.forEach(block => {
      if (block.id) {
        if (debugMode) console.debug(`(${Date.now()}) -- [graphInterval] Found new block: ${block.id}`);
        massaBlocks.push(block.id);  
      } else {
        console.error(`(${Date.now()}) -- [graphInterval] Undefined block ID`);
      }
    });
  })
  .catch(err => {
    console.error(err);
  });
}, graphIntervalMs);


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

      if (debugMode) console.debug(`(${Date.now()}) -- [massaBlockLookup] Operating block ${massaBlockId}`);

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
    console.error(err);
  });
}, blockLookupDelayMs);


/** massaOperations */
setInterval(async function () {

  const massaOperationId = massaOperations.shift();
  if (massaOperationId === undefined) {
    return;
  }
  if (debugMode) console.debug(`(${Date.now()}) -- [massaOperations] found operation ${massaOperationId}`);

  await w3Client.getOperations([massaOperationId])
  .then(operations => {
    operations.forEach(operation => {
      if (
        operation.id &&
        operation.is_operation_final &&
        !operation.in_pool &&
        operation.op_exec_status
      ) {
        if (debugMode) console.debug(`(${Date.now()}) -- [massaOperations] Operating ${operation.id}`);
        console.log(operation);
        console.log(operation.operation.content.op);  
      } else {
        console.warn(`(${Date.now()}) -- [massaOperations] Operation ${operation.id} is not final`);
      }
    })
  })
  .catch(err => {
    console.error(err);
  });
}, operationLookupDelayMs);