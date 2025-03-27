import type { BuilderNftType } from '@charmverse/core/prisma-client';

import { useGETImmutable } from '../../../../hooks/helpers';

export function useGetDeveloperToken({ builderId, nftType }: { builderId: string; nftType: BuilderNftType }) {
  return useGETImmutable<{
    tokenId: number;
    contractAddress: string;
    scoutAddress: string;
    builderNftId: string;
  }>(`/api/builders/${builderId}/token`, {
    nftType
  });
}
