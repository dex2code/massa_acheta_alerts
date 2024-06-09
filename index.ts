import * as dotenv from 'dotenv';
dotenv.config();


import {
  IProvider, IClientConfig,
  PublicApiClient, ProviderType,
} from "@massalabs/massa-web3";


/** Consts section */
const debugMode = true;

const tgToken = getEnvVariable("ACHETA_TELEGRAM_TOKEN");
const tgChat = getEnvVariable("ACHETA_TELEGRAM_CHAT");
const tgURL = `https://api.telegram.org/bot${tgToken}/sendMessage?chat_id=${tgChat}&text=`;
const tgCourierDelayMs = 2_100;

const exchangeURL = "https://api.bitget.com/api/v2/spot/market/tickers?symbol=MASUSDT";
const exchangeDelayMs = 5_000;

const publicApiURL = "https://mainnet.massa.net/api/v2";

const graphIntervalMs = 500;
const graphShiftMs = 120_000;
const graphLookupMs = 500;
const operationLookupMs = 100;

const timeOrigin = Date.now() - graphShiftMs;
var graphStart: number;
var graphEnd: number;


const w3Client = new PublicApiClient({
  providers: [{
    url: publicApiURL,
    type: ProviderType.PUBLIC
  } as IProvider ],
  retryStrategyOn: true
} as IClientConfig );
/** End of Consts section */


/** Global vars section */
var massaPrice = {
  currentValue: 0.0,
  fixedValue: 0.00,
  tresholdPercent: 2,
};

var massaBlocks: string[] = new Array();
var massaOps: string[] = new Array();
var tgMessages: string[] = new Array();
/** End of Global vars section */


/** Tools */
function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key} in .env file`);
  return value;
}

async function sendTgMessage (tgMessage: string): Promise<boolean> {
  debugMode? console.debug(`Sending message '${tgMessage}' to chat '${tgChat}'`) :{};

  return await fetch(tgURL + tgMessage)
    .then(response => {
      if (response.ok) {
        debugMode? console.debug(`Sent message '${tgMessage}' to chat '${tgChat}' with result '${response.status}' (${response.statusText})`) :{};
      } else {
        throw new Error(`Cannot send message to tgChat ${tgChat}: ${response.status} (${response.statusText})`);
      }
      return true;
    })
    .catch(err => {
      console.error(err);
      return false;
    });
}
/** End of Tools */


/**
 * TG Courier
 */
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


/**
 * Update MAS price
 * 
 * Get new value every ${exchangeDelayMS} milliseconds from ${exchangeURL}
 * If the new price differs from the old one by more than a ${massaPriceTresholdPercent}, the notification procedure is called.
 */
setInterval(async function () {
  debugMode? console.debug(`MAS Price updater interval run`) :{};

  await fetch(exchangeURL)
    .then(async function (response) {
      if (!response.ok) {
        throw new Error(`Cannot fetch from '${exchangeURL}': ${response.status} (${response.statusText})`);
      } else {
        debugMode? console.debug(`MAS Price update got ${response.status}`) :{};
      }
      return await response.json();
    })
    .then(async function (data) {
      if (data['msg'] != "success") {
        throw new Error(`Wrong msg value: '${data['msg']}'`);
      } else {
        debugMode? console.log(`Got ${JSON.stringify(data)} from exchange, new MAS Price value: ${data['data'].at(-1)['lastPr']}, fixedValue: ${massaPrice.fixedValue}`) :{};
        massaPrice.currentValue = parseFloat(data['data'].at(-1)['lastPr']);
        if (massaPrice.fixedValue == 0) {
          debugMode? console.debug(`Seems to be a first run - set fixedValue`) :{};
          massaPrice.fixedValue = massaPrice.currentValue;
        }
      }
      let massaPriceDiff = massaPrice.currentValue - massaPrice.fixedValue;
      if (Math.abs(massaPriceDiff) > (massaPrice.fixedValue / 100 * massaPrice.tresholdPercent)) {
        const massaPriceDiffPerscent = (massaPriceDiff / massaPrice.fixedValue * 100).toFixed(2);
        (massaPriceDiff >= 0)?
          tgMessages.push(` 🟢 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT ( +${massaPriceDiffPerscent} % )`) :
          tgMessages.push(` 🔴 MAS Price: ${massaPrice.fixedValue} → ${massaPrice.currentValue} USDT ( ${massaPriceDiffPerscent} % )`);
        massaPrice.fixedValue = massaPrice.currentValue;
      }
    })
    .catch(err => { console.log(err) });
}, exchangeDelayMs);
