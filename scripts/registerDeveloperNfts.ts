import { prisma } from '@charmverse/core/prisma-client';
import { getNFTContractAddress, getStarterNFTContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { registerDeveloperNFT } from '@packages/scoutgame/builderNfts/registration/registerDeveloperNFT';

async function registerDeveloperNfts() {
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
          season: '2025-W18',
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

  const season = '2025-W31'; // The season for which we are registering NFTs
  const standardContractAddress = getNFTContractAddress(season);
  const starterContractAddress = getStarterNFTContractAddress(season)

  for (const developer of sortedDevelopers) {
    try {
      await Promise.all([
        registerDeveloperNFT({
          builderId: developer.id,
          season,
          contractAddress: standardContractAddress
        }).then(() => {
          console.log(`Registered standard NFT for developer with ID: ${developer.id}`);
        }),
        // Register starter NFT if the developer does not have one
        registerDeveloperNFT({
          builderId: developer.id,
          season,
          contractAddress: starterContractAddress,
        }).then(() => {
          console.log(`Registered starter NFT for developer with ID: ${developer.id}`);
        })
      ])
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