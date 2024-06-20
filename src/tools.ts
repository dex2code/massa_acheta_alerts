import {
  debugMode,
  exchangeURL, exchangeTicker,
  githubAPI,
} from "./consts";

import {
  IExchangeData,
  IGithubRelease
} from "./types";


export function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`(${Date.now()}) -- [getEnvVariable] Missing or empty '${key}' key in .env file`);
  }
  return value;
}


export async function getMassaRelease (): Promise<string> {
  if (debugMode) console.debug(`(${Date.now()}) -> In function getMassaRelease`);

  return await fetch(githubAPI)
  .then(async function (response) {
    if (!response.ok) {
      throw new Error(`(${Date.now()}) -- [getMassaRelease] Cannot fetch from ${githubAPI}: ${response.status} '${response.statusText}'`);
    }
    return await response.json() as IGithubRelease;
  })
  .then(data => {
    if (!data['tag_name'] || data['draft'] || data['prerelease']) {
      throw new Error(`(${Date.now()}) -- [getMassaRelease] got bad data or not a final release`);
    }
    if (debugMode) console.debug(`(${Date.now()}) -- [getMassaRelease] ready to return '${data['tag_name']}'`);
    return data['tag_name'] as string;
  })
  .catch(err => {
    console.error(`(${Date.now()}) -- [getMassaRelease] Error:`);
    console.error(err);
    return "" as string;
  });
}


export async function getMassaPrice (): Promise<number> {
  if (debugMode) console.debug(`(${Date.now()}) -> In function getMassaPrice`);

  return await fetch(encodeURI(exchangeURL + exchangeTicker))
  .then(response => {
    if (!response.ok) {
      throw new Error(`(${Date.now()}) -- [getMassaPrice] Cannot fetch from '${exchangeURL}': ${response.status} '${response.statusText}'`);
    }
    return response.json() as Promise<IExchangeData>;
  })
  .then(data => {
    if (data['symbol'] != exchangeTicker || !data['price']) {
      throw new Error(`(${Date.now()}) -- [getMassaPrice] Wrong symbol value: '${data}'`);
    }
    if (debugMode) console.debug(`(${Date.now()}) -- [getMassaPrice] ready to return '${data['price']}'`);
    return parseFloat(data['price']) as number;
  })
  .catch(err => {
    console.error(`(${Date.now()}) -- [getMassaPrice] Error:`);
    console.error(err);
    return 0 as number;
  });
}


export function getSmlr (inString: string): string {
  let functionResult = inString;
  if (inString.length > 16) {
    functionResult = "#" + inString.slice(0, 6) + "..." + inString.slice(-4);
  } 
  return functionResult;
}