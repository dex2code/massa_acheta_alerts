console.log(`*** Massa Acheta Alerts started at ${new Date()}`);

import {
  debugMode,
  tgCourierDelayMs,
  exchangeDelayMs, exchangeTresholdPercent,
  githubDelayMs, githubReleasePath,
  w3Client,
  graphIntervalMs, graphTimeOrigin,
  operationLookupDelayMs
} from "./consts";

import {
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

var massaRelease: string = "OLD";

var massaPrice: IMassaPrice = {
  tresholdPercent: exchangeTresholdPercent,
};

var graphStart: number;
var graphEnd: number;

var massaBlocks: string[] = new Array();
var massaOps: string[] = new Array();
/** End of Global vars section */


/** TGCourier */
setInterval(async function () {
  if (debugMode) console.debug(`[TGCourier] interval run`);

  const tgMessage = tgMessages.shift();
  if (tgMessage === undefined) {
    if (debugMode) console.debug(`[TGCourier] No messages in Array`);
    return;
  }

  console.log(`[TGCourier] Found another message in tgQueue, trying to deliver:`);
  console.log(tgMessage);
  if (await sendTgMessage(tgMessage)) console.log(`[TGCourier] Sent message successfully`);
}, tgCourierDelayMs);


/** MassaReleaseUpdater */
setInterval(async function () {
  if (debugMode) console.debug(`[MassaReleaseUpdater] interval run`);

  const githubRelease = await getMassaRelease();
  if (!githubRelease) {
    console.error(`[MassaReleaseUpdater] Got empty or undefined value from getMassaRelease()`);
    return;
  }

  if (massaRelease === undefined) {
    console.log(`[MassaReleaseUpdater] A first run - set massaRelease ('${githubRelease}')`);
    massaRelease = githubRelease;
  }

  if (githubRelease != massaRelease) {
    console.log(`[MassaReleaseUpdater] New MASSA Release found ( '${massaRelease}' -> '${githubRelease}' )`);
    massaRelease = githubRelease;
    tgMessages.push(` 💾 A new MASSA Release available: ${massaRelease}.\n 📥 ${githubReleasePath}${massaRelease}`);
  } else {
    console.log(`[MassaReleaseUpdater] No new MASSA releases found: ('${githubRelease}' == '${massaRelease}')`);
  }
}, githubDelayMs);


/** MassaPriceUpdater */
setInterval(async function () {
  if (debugMode) console.debug(`[MassaPriceUpdater] interval run`);

  const exchangePrice = await getMassaPrice();
  if (!exchangePrice) {
    console.error(`[MassaPriceUpdater] Got empty or undefined value from getMassaPrice()`);
    return;
  }
  massaPrice.currentValue = exchangePrice;

  if (massaPrice.fixedValue === undefined) {
    console.log(`[MasPriceUpdater] A first run - set fixedValue (${massaPrice.currentValue})`)
    massaPrice.fixedValue = massaPrice.currentValue;
  }

  const massaPriceDiff = massaPrice.currentValue - massaPrice.fixedValue;
  if (Math.abs(massaPriceDiff) > (massaPrice.fixedValue / 100 * massaPrice.tresholdPercent)) {
    console.log(`[MasPriceUpdater] Threshold exceeded: (${massaPrice.fixedValue} -> ${massaPrice.currentValue})`);
    const massaPriceDiffPerscent = (Math.abs(massaPriceDiff) / massaPrice.fixedValue * 100).toFixed(2);
    if (massaPriceDiff >= 0) {
      tgMessages.push(` 🟢 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT ( ➕${massaPriceDiffPerscent}% )`);
    } else {
      tgMessages.push(` 🔴 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT ( ➖${massaPriceDiffPerscent}% )`);
    }
    massaPrice.fixedValue = massaPrice.currentValue;
  } else {
    console.log(`[MasPriceUpdater] Treshold not exceeded (${massaPrice.fixedValue} -> ${massaPrice.currentValue})`)
  }
}, exchangeDelayMs);


/** Get blocks with graphInterval
setInterval(async function () {
  debugMode? console.debug(`graphInterval run`) :{};

  (graphStart === undefined && graphEnd === undefined) ?
    graphStart = graphTimeOrigin :
    graphStart = graphEnd + 1;
    
  graphEnd = graphStart + graphIntervalMs;

  debugMode? console.debug(`Check interval: ${graphStart} -- ${graphEnd}`) :{};

  await w3Client.getGraphInterval({
    start: graphStart,
    end: graphEnd
  } as IGetGraphInterval)
  .then(async function (blocks) {
    blocks.forEach(async function (block) {
      if (block.id) {
        debugMode? console.debug(`Found new block: ${block.id}`) :{};
        massaBlocks.push(block.id);  
      } else {
        throw new Error(`Undefined block ID`);
      }
    });
  })
  .catch(err => { console.error(err); });
}, graphIntervalMs);


/** Get operations from stored blocks
setInterval(async function () {
  debugMode? console.debug(`Operations lookup run`) :{};

  const massaBlockId = massaBlocks.shift();
  if (massaBlockId === undefined) {
    debugMode? console.debug(`No blocks in Array`) :{};
    return;
  }
  debugMode? console.debug(`Operating ${massaBlockId} block...`) :{};


}, operationLookupDelayMs);
*/