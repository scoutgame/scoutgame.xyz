import { prisma } from '@charmverse/core/prisma-client';

import { uploadArtwork } from '../artwork/uploadArtwork';
import { uploadMetadata } from '../artwork/uploadMetadata';
import { uploadShareImage } from '../artwork/uploadShareImage';
import { builderContractReadonlyApiClient } from '../clients/builderContractReadClient';
import { builderNftChain, getBuilderContractAddress } from '../constants';

export async function createBuilderNft({
  imageHostingBaseUrl,
  avatar,
  tokenId,
  builderId,
  displayName,
  path,
  season,
  chainId = builderNftChain.id,
  contractAddress = getBuilderContractAddress()
}: {
  imageHostingBaseUrl?: string;
  displayName: string;
  path: string;
  avatar: string | null;
  tokenId: bigint;
  builderId: string;
  starterNft?: boolean;
  season: string;
  chainId?: number;
  contractAddress?: string;
}) {
  const currentPrice = await builderContractReadonlyApiClient.getTokenPurchasePrice({
    args: { tokenId, amount: BigInt(1) }
  });

  const fileUrl = await uploadArtwork({
    imageHostingBaseUrl,
    displayName,
    season,
    avatar,
    tokenId
  });

  const congratsImageUrl = await uploadShareImage({
    imageHostingBaseUrl,
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
