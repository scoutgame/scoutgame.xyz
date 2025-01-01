import { prisma } from '@charmverse/core/prisma-client';

import { getCurrentSeasonStart } from '../../dates/utils';
import { uploadMetadata } from '../artwork/uploadMetadata';
import { builderContractStarterPackReadonlyApiClient } from '../clients/builderContractStarterPackReadClient';
import { builderNftChain, getBuilderStarterPackContractAddress } from '../constants';

import { uploadStarterPackArtwork, uploadStarterPackArtworkCongrats } from './starterPack/uploadStarterPackArtwork';

export async function createBuilderNftStarterPack({
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
  const currentPrice = await builderContractStarterPackReadonlyApiClient.getTokenPurchasePrice({
    args: { amount: BigInt(1) }
  });

  const fileUrl = await uploadStarterPackArtwork({
    imageHostingBaseUrl,
    displayName,
    season: getCurrentSeasonStart(),
    avatar,
    tokenId
  });

  const congratsImageUrl = await uploadStarterPackArtworkCongrats({
    imageHostingBaseUrl,
    season: getCurrentSeasonStart(),
    tokenId,
    userImage: fileUrl,
    builderId
  });

  await uploadMetadata({
    season: getCurrentSeasonStart(),
    tokenId,
    path,
    starterPack: true
  });

  const builderNft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: getBuilderStarterPackContractAddress(),
      tokenId: Number(tokenId),
      season: getCurrentSeasonStart(),
      currentPrice,
      imageUrl: fileUrl,
      congratsImageUrl,
      nftType: 'starter_pack'
    }
  });

  return builderNft;
}
