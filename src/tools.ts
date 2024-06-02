import { PublicApiClient, IClientConfig, IProvider, ProviderType, IGetGraphInterval } from "@massalabs/massa-web3";
import { exchangeURL, publicApiURL } from "./consts";
import { IMassaBlock } from "./types";
import { start } from "repl";

export async function sleep(ms: number): Promise<void> {
  return new Promise(
      (resolve) => setTimeout(resolve, ms));
}


export async function updateMasPrice(): Promise<boolean> {
  let fResult = false;

  try {
    const response = await fetch(exchangeURL);

    if (!response.ok) {
      throw new Error(`Cannot fetch from '${exchangeURL}': ${response.status} (${response.statusText})`);
    }

    const data = await response.json();

    if (data['msg'] != 'success') {
      throw new Error(`Wrong msg value: '${data['msg']}'`);
    }

    let tMasPrice = parseFloat(
      data['data'].at(-1)['lastPr']
    );

    global.masPrice = tMasPrice;
    fResult = true;

  } catch (err) {
    console.error(err);
  }

  return fResult;
}


export async function createPublicApiClient(): Promise<PublicApiClient> {

  const mainnetPublicProvider: IProvider = {
    url: publicApiURL,
    type: ProviderType.PUBLIC
  } as IProvider;

  const clientConfig: IClientConfig = {
    providers: [mainnetPublicProvider],
    retryStrategyOn: true
  } as IClientConfig;

  const publicApiClient = new PublicApiClient(clientConfig);

  return publicApiClient;
}


export async function requestGraphInterval(_start: number, _end: number): Promise<IMassaBlock|unknown> {
  let funcResult: unknown;

  const graphInterval: IGetGraphInterval = {
    start: _start,
    end: _end
  } as IGetGraphInterval;

  try {
    const publicClient = await createPublicApiClient();
    funcResult = await publicClient.getGraphInterval(graphInterval);  
  } catch (err) {
    console.error(`Cannot request Graph Interval: ${err}`);
  }

  return funcResult;
}
