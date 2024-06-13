import * as dotenv from 'dotenv';
dotenv.config();

export const debugMode = (process.env['ACHETA_DEBUG'] === "true");


import { getEnvVariable } from "./tools";

export const tgToken = getEnvVariable("ACHETA_TELEGRAM_TOKEN");
export const tgChat = getEnvVariable("ACHETA_TELEGRAM_CHAT");
export const tgURL = `https://api.telegram.org/bot${tgToken}/sendMessage?chat_id=${tgChat}&text=`;
export const tgCourierDelayMs = 2_100;

export const githubAPI = "https://api.github.com/repos/massalabs/massa/releases/latest";
export const githubReleasePath = "https://github.com/massalabs/massa/releases/tag/"
export const githubDelayMs = 300_000;

export const exchangeURL = "https://api.mexc.com/api/v3/ticker/price?symbol=";
export const exchangeTicker = "MASUSDT";
export const exchangeDelayMs = 300_000;
export const exchangeTresholdPercent = 5;

export const publicApiURL = "https://mainnet.massa.net/api/v2";
// export const publicApiURL = "http://127.0.0.1:33035";

export const graphShiftMs = 120_000;
export const graphTimeOrigin = Date.now() - graphShiftMs;
export const graphIntervalMs = 500;

export const blockLookupDelayMs = 500;
export const operationLookupDelayMs = 10;


import {
  IProvider, IClientConfig,
  PublicApiClient, ProviderType,
} from "@massalabs/massa-web3";

export const w3Client = new PublicApiClient({
  providers: [{
    url: publicApiURL,
    type: ProviderType.PUBLIC
  } as IProvider ],
  retryStrategyOn: true
} as IClientConfig );
