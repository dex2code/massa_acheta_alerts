import {
  debugMode,
  tgURL, tgChat,
  exchangeURL, exchangeTicker,
  githubAPI
} from "./consts";


export function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing or empty '${key}' key in .env file`);
  }
  return value;
}


export async function sendTgMessage (tgMessage: string): Promise<boolean> {
  if (debugMode) console.debug(`-> In function sendTgMessage`);

  return await fetch(encodeURI(tgURL + tgMessage))
  .then(response => {
    if (!response.ok) {
      throw new Error(`[sendTgMessage] Cannot send message to tgChat ${tgChat}: ${response.status} (${response.statusText})`);
    }
    return true;
  })
  .catch(err => {
    console.error(`[sendTgMessage] Error:`);
    console.error(err);
    return false;
  });
}


export async function getMassaRelease (): Promise<string> {
  if (debugMode) console.debug(`-> In function getMassaRelease`);

  return await fetch(githubAPI)
  .then(async function (response) {
    if (!response.ok) {
      throw new Error(`[getMassaRelease] Cannot fetch from ${githubAPI}: ${response.status} '${response.statusText}'`);
    }
    return await response.json();
  })
  .then(data => {
    if (!data['tag_name'] || data['draft'] || data['prerelease']) {
      throw new Error(`[getMassaRelease] got bad data or not a final release`);
    }
    if (debugMode) console.debug(`[getMassaRelease] ready to return '${data['tag_name']}'`);
    return data['tag_name'] as string;
  })
  .catch(err => {
    console.error(`[getMassaRelease] Error:`);
    console.error(err);
    return "" as string;
  });
}


export async function getMassaPrice (): Promise<number> {
  if (debugMode) console.debug(`-> In function getMassaPrice`);

  return await fetch(encodeURI(exchangeURL + exchangeTicker))
  .then(async function (response) {
    if (!response.ok) {
      throw new Error(`[getMassaPrice] Cannot fetch from '${exchangeURL}': ${response.status} '${response.statusText}'`);
    }
    return await response.json();
  })
  .then(data => {
    if (data['symbol'] != exchangeTicker || !data['price']) {
      throw new Error(`[getMassaPrice] Wrong symbol value: '${data}'`);
    }
    if (debugMode) console.debug(`[getMassaPrice] ready to return '${data['price']}'`);
    return parseFloat(data['price']) as number;
  })
  .catch(err => {
    console.error(`Error in getMassaPrice:`);
    console.error(err);
    return 0 as number;
  });
}


