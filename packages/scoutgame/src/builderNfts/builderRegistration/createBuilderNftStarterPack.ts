import { prisma } from '@charmverse/core/prisma-client';
import type { Address } from 'viem';

import { getCurrentSeasonStart } from '../../dates/utils';
import { uploadMetadata } from '../artwork/uploadMetadata';
import { uploadStarterPackArtwork, uploadStarterPackArtworkCongrats } from '../artwork/uploadStarterPackArtwork';
import { builderContractStarterPackReadonlyApiClient } from '../clients/builderContractStarterPackReadClient';
import { builderNftChain, getBuilderStarterPackContractAddress } from '../constants';

export async function createBuilderNftStarterPack({
  avatar,
  tokenId,
  builderId,
  displayName,
  path,
  season = getCurrentSeasonStart(),
  chainId = builderNftChain.id,
  contractAddress = getBuilderStarterPackContractAddress()
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
  const currentPrice = await builderContractStarterPackReadonlyApiClient.getTokenPurchasePrice({
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
      currentPrice,
      imageUrl: fileUrl,
      congratsImageUrl,
      nftType: 'starter_pack'
    }
  });

  return builderNft;
}
