import { prisma } from '@charmverse/core/prisma-client';

import { uploadArtwork } from '../artwork/uploadArtwork';
import { uploadMetadata } from '../artwork/uploadMetadata';
import { uploadShareImage } from '../artwork/uploadShareImage';
import { getPreSeasonTwoBuilderNftContractReadonlyClient } from '../clients/preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { builderNftChain, getBuilderNftContractAddress } from '../constants';

export async function createBuilderNft({
  avatar,
  tokenId,
  builderId,
  displayName,
  path,
  season,
  chainId = builderNftChain.id,
  contractAddress
}: {
  displayName: string;
  path: string;
  avatar: string;
  tokenId: bigint;
  builderId: string;
  starterNft?: boolean;
  season: string;
  chainId?: number;
  contractAddress?: string;
}) {
  contractAddress = contractAddress ?? getBuilderNftContractAddress(season);

  // TODO: use the correct client for the season when we move to $SCOUT
  const currentPrice = await getPreSeasonTwoBuilderNftContractReadonlyClient().getTokenPurchasePrice({
    args: { tokenId, amount: BigInt(1) }
  });

  const fileUrl = await uploadArtwork({
    displayName,
    season,
    avatar,
    tokenId
  });

  const congratsImageUrl = await uploadShareImage({
    season,
    tokenId,
    userImage: fileUrl,
    builderId
  });

  await uploadMetadata({
    season,
    tokenId,
    path
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
      congratsImageUrl
    }
  });

  return builderNft;
}
