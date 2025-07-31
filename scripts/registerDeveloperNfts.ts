import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { registerDeveloperNFT } from '@packages/scoutgame/builderNfts/registration/registerDeveloperNFT';

async function registerDeveloperNfts() {
  const currentSeasonStart = getCurrentSeasonStart();
  const developers = await prisma.scout.findMany({
    where: {
      builderStatus: {
        in: ['approved', 'banned']
      }
    },
    select: {
      id: true,
      builderNfts: {
        where: {
          season: currentSeasonStart,
          nftType: 'default'
        },
        select: {
          tokenId: true
        }
      }
    }
  })

  const sortedDevelopers = developers.sort((a, b) => {
    const aBuilderNftTokenId = a.builderNfts[0]?.tokenId || 0;
    const bBuilderNftTokenId = b.builderNfts[0]?.tokenId || 0;

    return aBuilderNftTokenId - bBuilderNftTokenId;
  })

  const totalDevelopers = developers.length;
  let currentDeveloper = 0

  console.log(`Total developers to register NFTs for: ${totalDevelopers}`);

  for (const developer of sortedDevelopers) {
    try {
      await registerDeveloperNFT({
        builderId: developer.id,
        season: currentSeasonStart,
      });
    } catch (error) {
      console.error(`Failed to register NFT for developer with ID: ${developer.id}`, error);
      continue; // Skip to the next developer if there's an error
    } finally {
      currentDeveloper++;
      console.log(`Progress: ${currentDeveloper}/${totalDevelopers}`);
    }
  }
}

registerDeveloperNfts()