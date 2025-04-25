import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { formatUnits } from 'ethers';
import type { Address } from 'viem';

import { getStarterNFTReadonlyClient } from '../../protocol/clients/getStarterNFTClient';
import { devTokenDecimals } from '../../protocol/constants';
import { uploadMetadata } from '../artwork/uploadMetadata';
import { uploadStarterPackArtwork, uploadStarterPackArtworkCongrats } from '../artwork/uploadStarterPackArtwork';
import { nftChain, getStarterNFTContractAddress } from '../constants';

export async function createBuilderNftStarterPack({
  avatar,
  tokenId,
  builderId,
  displayName,
  path,
  season = getCurrentSeasonStart(),
  chainId = nftChain.id,
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
  contractAddress = contractAddress ?? getStarterNFTContractAddress(season);
  const client = getStarterNFTReadonlyClient(season);
  if (!client || !contractAddress) {
    throw new Error(`Dev NFT contract client not found: ${season}, contractAddress: ${contractAddress}`);
  }

  const currentPrice = await client.getTokenPurchasePrice({
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
      currentPrice: BigInt(parseInt(formatUnits(currentPrice, devTokenDecimals))),
      currentPriceDevToken: currentPrice.toString(),
      imageUrl: fileUrl,
      congratsImageUrl,
      nftType: 'starter_pack'
    }
  });

  return builderNft;
}
