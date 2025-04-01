import type { BuilderNftType } from '@charmverse/core/prisma-client';
import type { BuilderSearchResult } from '@packages/scoutgame/builders/searchBuilders';

import { useGETImmutable, usePUT } from '../helpers';

export function useRefreshShareImage() {
  return usePUT<{ builderId?: string }, void>('/api/builders/refresh-congrats');
}

export function useGetDeveloperToken({ builderId, nftType }: { builderId: string; nftType: BuilderNftType }) {
  return useGETImmutable<{
    tokenId: number;
    contractAddress: string;
    scoutAddress: string;
    builderNftId: string;
    developerWallet?: string;
  }>(`/api/builders/${builderId}/token`, {
    nftType
  });
}
