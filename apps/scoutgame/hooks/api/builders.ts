import type { BuilderNftType } from '@charmverse/core/prisma-client';
import type { BuilderSearchResult } from '@packages/scoutgame/builders/searchBuilders';
import { useGETImmutable, usePUT } from '@packages/scoutgame-ui/hooks/helpers';

export function useSearchBuilders(search: string) {
  return useGETImmutable<BuilderSearchResult[]>(search ? '/api/builders/search' : null, {
    search
  });
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
