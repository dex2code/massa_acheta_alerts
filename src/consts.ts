import * as dotenv from 'dotenv';
dotenv.config();

export const debugMode = (process.env['ACHETA_DEBUG'] === "true");


import {
  getEnvVariable,
} from "./tools";


export const tgToken = getEnvVariable("ACHETA_TELEGRAM_TOKEN");
export const tgChat = getEnvVariable("ACHETA_TELEGRAM_CHAT");
export const tgOwner = getEnvVariable("ACHETA_TELEGRAM_OWNER");
export const tgCourierDelayMs = 2_100;

export const githubAPI = "https://api.github.com/repos/massalabs/massa/releases/latest";
export const githubReleasePath = "https://github.com/massalabs/massa/releases/tag/"
export const githubDelayMs = 60_000;

export const exchangeURL = "https://api.mexc.com/api/v3/ticker/price?symbol=";
export const exchangeTicker = "MASUSDT";
export const exchangeDelayMs = 60_000;
export const exchangeTresholdPercent = 5;

// export const publicApiURL = "https://mainnet.massa.net/api/v2";
export const publicApiURL = "http://127.0.0.1:33035";

export const graphShiftMs = 120_000;
export const graphTimeOrigin = Date.now() - graphShiftMs;

export const chainLookupDelayMs = 500;

export const rollPrice = 100;
export const operationTresholdValueUSDT = 5_000;

export const opExplorerURL = "https://explorer.massa.net/mainnet/operation/";


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


export const dieAfterMs = 28_800_000;