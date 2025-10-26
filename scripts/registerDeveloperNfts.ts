import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getNFTContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { registerDeveloperNFT } from '@packages/scoutgame/builderNfts/registration/registerDeveloperNFT';
import { registerDeveloperStarterNFT } from '@packages/scoutgame/builderNfts/registration/registerDeveloperStarterNFT';

async function registerDeveloperNfts() {
  const currentSeason = getCurrentSeasonStart();
  const developers = await prisma.scout.findMany({
    where: {
      builderStatus: {
        in: ['approved', 'banned']
      },
      builderNfts: {
        some: {
          season: currentSeason,
          nftType: 'default'
        }
      }
    },
    orderBy: {
      id: 'asc'
    },
    select: {
      id: true,
      builderNfts: {
        where: {
          season: currentSeason,
          nftType: 'default'
        },
        select: {
          tokenId: true
        }
      }
    }
  });

  const sortedDevelopers = developers
    .sort((a, b) => {
      const aBuilderNftTokenId = a.builderNfts[0]?.tokenId || 0;
      const bBuilderNftTokenId = b.builderNfts[0]?.tokenId || 0;

      return aBuilderNftTokenId - bBuilderNftTokenId;
    })
    .map((developer) => ({
      id: developer.id,
      tokenId: developer.builderNfts[0]?.tokenId || 0
    }))
    .slice(20);

  let currentDeveloper = 0;

  console.log(`Total developers to register NFTs for: ${sortedDevelopers.length}`);

  const season = '2025-W44'; // The season for which we are registering NFTs
  const standardContractAddress = getNFTContractAddress(season);

  for (const developer of sortedDevelopers) {
    await registerDeveloperNFT({
      builderId: developer.id,
      season,
      contractAddress: standardContractAddress
    }).then(() => {
      console.log(`Registered standard NFT for developer with ID: ${developer.tokenId}`);
    });

    await registerDeveloperStarterNFT({
      builderId: developer.id,
      season
    }).then(() => {
      console.log(`Registered starter NFT for developer with ID: ${developer.tokenId}`);
    });
    currentDeveloper++;
    console.log(`Progress: ${currentDeveloper}/${sortedDevelopers.length}\n\n\n\n`);
  }
}

registerDeveloperNfts();
