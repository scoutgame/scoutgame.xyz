import { log } from '@charmverse/core/log';

import { airstackRequest } from './airstackRequest';

type MoxieFanToken = {
  currentPrice: number;
  currentPriceInWei: number;
  dailyVolumeChange: number;
  fanTokenAddress: string;
  fanTokenName: string;
  fanTokenSymbol: string;
  lockedTvl: number;
  tlv: number;
  tokenLockedAmount: number;
  tokenUnlockedAmount: number;
  totalSupply: number;
  uniqueHolders: number;
  unlockedTvl: number;
};

export async function getMoxieFanToken(farcasterId: number): Promise<MoxieFanToken | null> {
  const query = `
    query MyQuery {
      MoxieFanTokens(
        input: {filter: {fanTokenSymbol: {_eq: "fid:${farcasterId}"}}, blockchain: ALL}
      ) {
        MoxieFanToken {
          currentPrice
          currentPriceInWei
          dailyVolumeChange
          fanTokenAddress
          fanTokenName
          fanTokenSymbol
          lockedTvl
          tlv
          tokenLockedAmount
          tokenUnlockedAmount
          totalSupply
          uniqueHolders
          unlockedTvl
        }
      }
    }
  `;
  const response = await airstackRequest<any>(query);
  if (response.errors?.length) {
    log.warn('Errors fetching Moxie fan token balances', { farcasterId, errors: response.errors });
    throw new Error(`Errors fetching Moxie fan token balances: ${response.errors[0].message}`);
  }
  return response.data.MoxieFanTokens.MoxieFanToken?.[0] || null;
}
