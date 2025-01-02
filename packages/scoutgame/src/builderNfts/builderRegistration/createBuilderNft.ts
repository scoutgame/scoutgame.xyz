import { prisma } from '@charmverse/core/prisma-client';

import { getCurrentSeasonStart } from '../../dates/utils';
import { uploadArtwork } from '../artwork/uploadArtwork';
import { uploadMetadata } from '../artwork/uploadMetadata';
import { uploadShareImage } from '../artwork/uploadShareImage';
import { builderContractReadonlyApiClient } from '../clients/builderContractReadClient';
import { builderNftChain, getBuilderNftContractAddress } from '../constants';

export async function createBuilderNft({
  imageHostingBaseUrl,
  avatar,
  tokenId,
  builderId,
  displayName,
  path
}: {
  imageHostingBaseUrl?: string;
  displayName: string;
  path: string;
  avatar: string | null;
  tokenId: bigint;
  builderId: string;
  starterNft?: boolean;
}) {
  const currentPrice = await builderContractReadonlyApiClient.getTokenPurchasePrice({
    args: { tokenId, amount: BigInt(1) }
  });

  const fileUrl = await uploadArtwork({
    imageHostingBaseUrl,
    displayName,
    season: getCurrentSeasonStart(),
    avatar,
    tokenId
  });

  const congratsImageUrl = await uploadShareImage({
    imageHostingBaseUrl,
    season: getCurrentSeasonStart(),
    tokenId,
    userImage: fileUrl,
    builderId
  });

  await uploadMetadata({
    season: getCurrentSeasonStart(),
    tokenId,
    path
  });

  const builderNft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: getBuilderNftContractAddress(),
      tokenId: Number(tokenId),
      season: getCurrentSeasonStart(),
      currentPrice,
      imageUrl: fileUrl,
      congratsImageUrl
    }
  });

  return builderNft;
}
