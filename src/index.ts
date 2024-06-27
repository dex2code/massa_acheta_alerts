import {
  debugMode,
  tgOwner, tgChat, tgToken, tgCourierDelayMs,
  exchangeDelayMs, exchangeTresholdPercent,
  githubDelayMs, githubReleasePath,
} from "./consts";

import {
  IMassaPrice,
} from "./types";

import {
  getMassaPrice,
  getMassaRelease,
} from "./tools";


import TelegramBot from 'node-telegram-bot-api';
const tgBot = new TelegramBot(tgToken, {polling: false});

console.info(`*** Massa Acheta Alerts started at ${new Date()}`);
tgBot.sendMessage(tgOwner, `*** Massa Acheta Alerts started at ${new Date()}`);


/** Global vars section */
var tgMessages: string[] = new Array();

var massaRelease: string;
(async function () {
  const tMassaRelease = await getMassaRelease();
  if (!tMassaRelease) {
    throw new Error(`(${Date.now()}) -- [achetaAlerts] Cannot set massaRelease - got '${tMassaRelease}' value`);
  }
  massaRelease = tMassaRelease;
  console.log(`(${Date.now()}) -- [achetaRelease] Set massaRelease = '${massaRelease}'`);
})();

var massaPrice = {
  tresholdPercent: exchangeTresholdPercent,
} as IMassaPrice;
(async function () {
  const tMassaPrice = await getMassaPrice();
  if (!tMassaPrice) {
    throw new Error(`(${Date.now()}) -- [achetaAlerts] Cannot set massaPrice - got '${tMassaPrice}' value`);
  }
  massaPrice.currentValue = tMassaPrice;
  massaPrice.fixedValue = tMassaPrice;
  console.log(`(${Date.now()}) -- [achetaAlerts] Set massaPrice = '${massaPrice.fixedValue}'`);
})();

/** End of Global vars section */


/** TGCourier */
setInterval(async function () {
  if (debugMode) console.debug(`(${Date.now()}) -- [TGCourier] Interval run`);

  const tgMessage = tgMessages.shift();
  if (tgMessage === undefined) {
    if (debugMode) console.debug(`(${Date.now()}) -- [TGCourier] No messages in Array`);
    return;
  }

  console.log(`(${Date.now()}) -- [TGCourier] Found another message in tgQueue, trying to deliver`);
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

    const massaPriceDiff = massaPrice.currentValue - massaPrice.fixedValue;
    if (Math.abs(massaPriceDiff) > (massaPrice.fixedValue / 100 * massaPrice.tresholdPercent)) {
      console.log(`(${Date.now()}) -- [MasPriceUpdater] Threshold exceeded: (${massaPrice.fixedValue} -> ${massaPrice.currentValue})`);
      const massaPriceDiffPerscent = (Math.abs(massaPriceDiff) / massaPrice.fixedValue * 100).toFixed(2);
      if (massaPrice.currentValue > massaPrice.fixedValue) {
        tgMessages.push(` 🟢 MAS Price: ${massaPrice.fixedValue.toFixed(4)} → ${massaPrice.currentValue.toFixed(4)} USDT\n ↑ ${massaPriceDiffPerscent}%`);
      } else {
        tgMessages.push(` 🔴 MAS Price: ${massaPrice.fixedValue.toFixed(4)} → ${massaPrice.currentValue.toFixed(4)} USDT\n ↓ ${massaPriceDiffPerscent}%`);
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
