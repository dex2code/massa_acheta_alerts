import {
  debugMode,
  tgURL, tgChat,
  exchangeURL, exchangeTicker,
  githubAPI
} from "./consts";


export function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key} in .env file`);
  return value;
}


export async function sendTgMessage (tgMessage: string): Promise<boolean> {
  debugMode? console.debug(`Sending message '${tgMessage}' to chat '${tgChat}'`) :{};

  return await fetch(encodeURI(tgURL + tgMessage))
  .then(response => {
    if (response.ok) {
      debugMode? console.debug(`Successfully sent message '${tgMessage}' to chat '${tgChat}' with result '${response.status}' (${response.statusText})`) :{};
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


export async function getMassaPrice (): Promise<number> {
  debugMode? console.debug(`In function getMassaPrice`) :{};
  let massaPrice = 0;

  await fetch(encodeURI(exchangeURL + exchangeTicker))
  .then(async function (response) {
    if (!response.ok) {
      throw new Error(`Cannot fetch from '${exchangeURL}': ${response.status} (${response.statusText})`);
    } else {
      debugMode? console.debug(`MAS Price update got ${response.status}`) :{};
    }
    return await response.json();
  })
  .then(data => {
    if (data['symbol'] != exchangeTicker || !data['price']) {
      throw new Error(`Wrong data value: '${data}'`);
    } else {
      massaPrice = parseFloat(data['price']);
    }
  })
  .catch(err => { console.error(err) });

  debugMode? console.debug(`getMassaPrice ready to return ${massaPrice}`) :{};
  return massaPrice;
}


export async function getMassaRelease (): Promise<string> {
  debugMode? console.debug(`In function getMassaRelease`) :{};
  let massaRelease = "";

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
    if (data['tag_name'] && !data['draft'] && !data['prerelease']) {
      massaRelease = data['tag_name'];
    } else {
      console.warn(`getMassaRelease got bad data - not a release`);
    }
  })
  .catch(err => { console.error(err); });

  debugMode? console.debug(`getMassaRelease ready to return ${massaRelease}`) :{};
  return massaRelease;
}
