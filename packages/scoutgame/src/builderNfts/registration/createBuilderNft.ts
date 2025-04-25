import { prisma } from '@charmverse/core/prisma-client';
import { formatUnits } from 'viem';

import { getNFTReadonlyClient } from '../../protocol/clients/getNFTClient';
import { devTokenDecimals } from '../../protocol/constants';
import { uploadArtwork } from '../artwork/uploadArtwork';
import { uploadMetadata } from '../artwork/uploadMetadata';
import { uploadShareImage } from '../artwork/uploadShareImage';
import { nftChain, getNFTContractAddress } from '../constants';

export async function createBuilderNft({
  avatar,
  tokenId,
  builderId,
  displayName,
  path,
  season,
  chainId = nftChain.id,
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
  contractAddress = contractAddress ?? getNFTContractAddress(season);
  const client = getNFTReadonlyClient(season);
  if (!client || !contractAddress) {
    throw new Error(`Dev NFT contract client not found: ${season}, contractAddress: ${contractAddress}`);
  }

  const currentPrice = await client.getTokenPurchasePrice({
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
      currentPrice: BigInt(formatUnits(currentPrice, devTokenDecimals)),
      currentPriceDevToken: currentPrice.toString(),
      imageUrl: fileUrl,
      congratsImageUrl
    }
  });

  return builderNft;
}
