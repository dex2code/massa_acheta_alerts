console.log(`*** Massa Acheta Alerts started at ${new Date()}`);

import {
  debugMode,
  tgCourierDelayMs,
  exchangeURL, exchangeDelayMs,
  githubAPI, githubRelease, githubDelayMs
} from "./consts";

import { sendTgMessage } from "./tools";

/** Global vars section */
var massaPrice = {
  currentValue: 0.0,
  fixedValue: 0.0,
  tresholdPercent: 2,
};

var massaRelease = "";

var massaBlocks: string[] = new Array();
var massaOps: string[] = new Array();
var tgMessages: string[] = new Array();
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

  await fetch(encodeURI(exchangeURL))
  .then(async function (response) {
    if (!response.ok) {
      throw new Error(`Cannot fetch from '${exchangeURL}': ${response.status} (${response.statusText})`);
    } else {
      debugMode? console.debug(`MAS Price update got ${response.status}`) :{};
    }
    return await response.json();
  })
  .then(async function (data) {
    if (data['msg'] != "success" || !data['data'].at(-1)['lastPr']) {
      throw new Error(`Wrong data value: '${data['msg']}' -- '${data['data']}'`);
    } else {
      debugMode? console.debug(`Got ${JSON.stringify(data)} from exchange, new MAS Price value: ${data['data'].at(-1)['lastPr']}, fixedValue: ${massaPrice.fixedValue}`) :{};
      massaPrice.currentValue = parseFloat(data['data'].at(-1)['lastPr']);
      if (massaPrice.fixedValue == 0) {
        debugMode? console.debug(`Seems to be a first run - set fixedValue`) :{};
        massaPrice.fixedValue = massaPrice.currentValue;
      }
    }
    let massaPriceDiff = massaPrice.currentValue - massaPrice.fixedValue;
    if (Math.abs(massaPriceDiff) > (massaPrice.fixedValue / 100 * massaPrice.tresholdPercent)) {
      const massaPriceDiffPerscent = (Math.abs(massaPriceDiff) / massaPrice.fixedValue * 100).toFixed(2);
      (massaPriceDiff >= 0)?
        tgMessages.push(` 🟢 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT ( ➕${massaPriceDiffPerscent} % )`) :
        tgMessages.push(` 🔴 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT ( ➖${massaPriceDiffPerscent} % )`);
      massaPrice.fixedValue = massaPrice.currentValue;
    }
  })
  .catch(err => { console.error(err) });
}, exchangeDelayMs);


/** Check MASSA Release */
setInterval(async function () {
  debugMode? console.debug(`GitHUB MASSA Release interval run`) :{};

  await fetch(githubAPI)
  .then(async function (response) {
    if (!response.ok) {
      throw new Error(`Cannot fetch from '${githubAPI}': ${response.status} (${response.statusText})`);
    } else {
      debugMode? console.debug(`GitHUB MASSA Release checker got ${response.status}`) :{};
    }
    return await response.json();
  })
  .then(async function (data) {
    if (!data['tag_name']) {
      throw new Error(`Wrong MASSA Release version received`);
    }
    if (massaRelease === "") {
      debugMode? console.debug(`Seems to be a first run - set massaRelease`) :{};
      massaRelease = data['tag_name'];
    }
    if (data['tag_name'] != massaRelease && !data['draft'] && !data['prerelease']) {
      debugMode? console.log(`New MASSA Release found: '${data['tag_name']}'`) :{};
      massaRelease = data['tag_name'];
      tgMessages.push(` 💾 A new MASSA Release available: ${massaRelease}.\n 📥 ${githubRelease}${massaRelease}`);
    } else {
      debugMode? console.debug(`No new MASSA releases found (${data['tag_name']})`) :{};
    }
  })
  .catch(err => { console.error(err); });

}, githubDelayMs);


