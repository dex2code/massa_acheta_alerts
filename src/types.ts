export interface IMassaPrice {
  currentValue: number,
  fixedValue: number,
  tresholdPercent: number,
}

export interface IMassaBlock {
  id: string,
  content: null | {
    is_final: boolean,
    is_in_blockclique: boolean,
    is_candidate: boolean,
    is_discarded: boolean,
    block: null | {
      operations: Array<string>,
    }
  }
}

export interface IExchangeData {
  symbol: string,
  price: string,
}

export interface IGithubRelease {
  tag_name: string,
  draft: boolean,
  prerelease: boolean,
}