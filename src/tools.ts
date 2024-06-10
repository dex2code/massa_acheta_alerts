import {
  debugMode,
  tgURL, tgChat,
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
