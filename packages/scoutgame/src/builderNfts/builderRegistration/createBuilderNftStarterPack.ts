import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getPlatform } from '@packages/utils/platform';
import type { Address } from 'viem';

import { uploadMetadata } from '../artwork/uploadMetadata';
import { uploadStarterPackArtwork, uploadStarterPackArtworkCongrats } from '../artwork/uploadStarterPackArtwork';
import { getBuilderNftStarterPackReadonlyClient } from '../clients/starterPack/getBuilderContractStarterPackReadonlyClient';
import { builderNftChain, getBuilderNftStarterPackContractAddress } from '../constants';

const platform = getPlatform();

export async function createBuilderNftStarterPack({
  avatar,
  tokenId,
  builderId,
  displayName,
  path,
  season = getCurrentSeasonStart(),
  chainId = builderNftChain.id,
  contractAddress
}: {
  displayName: string;
  path: string;
  avatar: string;
  tokenId: bigint;
  builderId: string;
  starterNft?: boolean;
  season?: string;
  chainId?: number;
  contractAddress?: Address;
}) {
  contractAddress = contractAddress ?? getBuilderNftStarterPackContractAddress(season);

  const currentPrice = await getBuilderNftStarterPackReadonlyClient().getTokenPurchasePrice({
    args: { amount: BigInt(1) }
  });

  const fileUrl = await uploadStarterPackArtwork({
    displayName,
    season,
    avatar,
    tokenId
  });

  const congratsImageUrl = await uploadStarterPackArtworkCongrats({
    season,
    tokenId,
    userImage: fileUrl,
    builderId
  });

  await uploadMetadata({
    season,
    tokenId,
    path,
    starterPack: true
  });

  const builderNft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId,
      contractAddress,
      tokenId: Number(tokenId),
      season,
      currentPrice: platform === 'onchain_webapp' ? undefined : currentPrice,
      currentPriceInScoutToken: platform === 'onchain_webapp' ? currentPrice.toString() : undefined,
      imageUrl: fileUrl,
      congratsImageUrl,
      nftType: 'starter_pack'
    }
  });

  return builderNft;
}
