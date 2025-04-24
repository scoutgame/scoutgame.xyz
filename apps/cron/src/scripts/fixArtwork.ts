import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { uploadMetadata } from '@packages/scoutgame/builderNfts/artwork/uploadMetadata';
import { getBuilderNftContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { uploadArtwork } from '@packages/scoutgame/builderNfts/artwork/uploadArtwork';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getNftReadonlyClient } from '@packages/scoutgame/protocol/clients/getNFTClient';

async function refreshArtworks() {
  const builderNfts = await prisma.builderNft.findMany({
    where: {
      season: getCurrentSeasonStart()
    },
    include: {
      builder: {
        select: {
          avatar: true,
          path: true,
          displayName: true
        }
      }
    },
    orderBy: {
      tokenId: 'asc'
    }
  });

  console.log('Contract ', getBuilderNftContractAddress(getCurrentSeasonStart()));

  const totalNfts = builderNfts.length;

  console.log(totalNfts);

  for (let i = 0; i < totalNfts; i++) {
    const nft = builderNfts[i];
    log.info(`[tokenId: ${nft.tokenId}] Updating artwork for NFT ${i + 1} of ${totalNfts} `);

    const avatar = nft.builder.avatar as string;

    if (!avatar) {
      log.warn(`No avatar found for builder ${nft.builderId} at index ${i}`);
    }

    const tokenId = await getNftReadonlyClient(getCurrentSeasonStart()).getTokenIdForBuilder({
      args: { builderId: nft.builderId }
    });

    if (Number(tokenId) !== nft.tokenId) {
      throw new Error(`Token ID mismatch for builder ${nft.builderId} at index ${i}`);
    }

    const filePath = await uploadArtwork({
      avatar,
      season: getCurrentSeasonStart(),
      tokenId: BigInt(tokenId),
      displayName: nft.builder.displayName
    });

    await prisma.builderNft.update({
      where: {
        id: nft.id
      },
      data: {
        imageUrl: filePath
      }
    });

    const metadataPath = await uploadMetadata({
      season: getCurrentSeasonStart(),
      tokenId: BigInt(tokenId),
      path: nft.builder.path!,
      attributes: []
    });

    log.info('Artwork uploaded', filePath);
    log.info('Metadata uploaded', metadataPath);
  }
}

// refreshArtworks().then(console.log);
