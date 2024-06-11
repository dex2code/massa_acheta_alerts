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

var massaRelease: string;

var massaPrice: IMassaPrice = {
  tresholdPercent: exchangeTresholdPercent,
};

var graphStart: number;
var graphEnd: number;

var massaBlocks: string[] = new Array();
var massaOps: string[] = new Array();
/** End of Global vars section */


/** TG Courier */
setInterval(async function () {
  debugMode? console.debug(`TG Courier interval run`) :{};

  const tgMessage = tgMessages.shift();
  if (tgMessage === undefined) {
    debugMode? console.debug(`No TG messages in Array`) :{};
    return;
  } else {
    debugMode?
      console.debug(`Found '${tgMessage}' message in queue, trying to deliver...`) :
      console.log(`Found another message in tgQueue, trying to deliver...`);
  }

  await sendTgMessage(tgMessage)?
    console.log(`Sent TG message successfully`) :
    console.log(`Error sending TG message`);

}, tgCourierDelayMs);


/** Update MAS price */
setInterval(async function () {
  debugMode? console.debug(`MAS Price updater interval run`) :{};

  const exchangePrice = await getMassaPrice();
  debugMode? console.debug(`Got ${exchangePrice} from getMassaPrice`) :{};
  if (!exchangePrice) {
    return;
  }

  massaPrice.currentValue = exchangePrice;
  if (massaPrice.fixedValue === undefined) {
    debugMode? console.debug(`Seems to be a first run - set fixedValue`) :{};
    massaPrice.fixedValue = massaPrice.currentValue;
  }

  const massaPriceDiff = massaPrice.currentValue - massaPrice.fixedValue;
  if (Math.abs(massaPriceDiff) > (massaPrice.fixedValue / 100 * massaPrice.tresholdPercent)) {
    debugMode? console.debug(`Found MAS Price threshold exceeded detected (${massaPrice.fixedValue} -> ${massaPrice.currentValue})`) :{};
    const massaPriceDiffPerscent = (Math.abs(massaPriceDiff) / massaPrice.fixedValue * 100).toFixed(2);
    (massaPriceDiff >= 0)?
      tgMessages.push(` 🟢 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT ( ➕${massaPriceDiffPerscent} % )`) :
      tgMessages.push(` 🔴 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT ( ➖${massaPriceDiffPerscent} % )`);
    massaPrice.fixedValue = massaPrice.currentValue;
  }
}, exchangeDelayMs);


/** Check MASSA Release */
setInterval(async function () {
  debugMode? console.debug(`GitHUB MASSA Release interval run`) :{};

  const githubRelease = await getMassaRelease();
  if (!githubRelease) {
    return;
  }

  if (massaRelease === undefined) {
    debugMode? console.debug(`Seems to be a first run - set massaRelease`) :{};
    massaRelease = githubRelease;
  }

  if (githubRelease != massaRelease) {
    debugMode? console.log(`New MASSA Release found: '${githubRelease}'`) :{};
    massaRelease = githubRelease;
    tgMessages.push(` 💾 A new MASSA Release available: ${massaRelease}.\n 📥 ${githubReleasePath}${massaRelease}`);
  } else {
    debugMode? console.debug(`No new MASSA releases found (${githubRelease})`) :{};
  }
}, githubDelayMs);


/** Get blocks with graphInterval */
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


/** Get operations from stored blocks */
setInterval(async function () {
  debugMode? console.debug(`Operations lookup run`) :{};

  const massaBlockId = massaBlocks.shift();
  if (massaBlockId === undefined) {
    debugMode? console.debug(`No blocks in Array`) :{};
    return;
  }
  debugMode? console.debug(`Operating ${massaBlockId} block...`) :{};


}, operationLookupDelayMs);