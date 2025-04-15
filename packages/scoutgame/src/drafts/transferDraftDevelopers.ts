import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import type { DraftSeasonOffer } from '@prisma/client';
import { ethers } from 'ethers';
import { shuffle } from 'lodash';
import { parseUnits } from 'viem';
import { base } from 'viem/chains';

type ProcessDraftOffersParams = {
  provider: ethers.Provider;
  signer: ethers.Signer;
  nftContractAddress: string;
  devTokenAddress: string;
};

export async function processDraftOffers({ nftContractAddress, devTokenAddress }: ProcessDraftOffersParams) {
  const privateKey = process.env.PRIVATE_KEY;
  const walletClient = getWalletClient({
    chainId: base.id,
    privateKey: privateKey as `0x${string}`
  });

  const season = getCurrentSeasonStart();

  // Get all developers who have draft offers
  const developersWithOffers = await prisma.scout.findMany({
    where: {
      draftSeasonOffersReceived: {
        some: {
          season,
          status: 'success'
        }
      }
    },
    select: {
      id: true,
      path: true,
      wallets: {
        select: {
          address: true
        }
      },
      draftSeasonOffersReceived: {
        where: {
          season,
          status: 'success'
        },
        select: {
          id: true,
          value: true,
          makerWalletAddress: true
        }
      }
    }
  });

  // Initialize contracts
  const nftContract = new ethers.Contract(nftContractAddress, [
    'function getTokenIdForBuilder(string) view returns (uint256)',
    'function mintTo(address, uint256, uint256)'
  ]);

  const devToken = new ethers.Contract(devTokenAddress, [
    'function transfer(address to, uint256 amount) returns (bool)'
  ]);

  for (const developer of developersWithOffers) {
    const developerWallet = developer.wallets[0]?.address;
    if (!developerWallet) {
      log.error(`Developer ${developer.path} has no wallet address`);
      continue;
    }

    // Group offers by value to handle ties
    const offersByValue = developer.draftSeasonOffersReceived.reduce<
      Record<string, Pick<DraftSeasonOffer, 'id' | 'makerWalletAddress' | 'value'>[]>
    >((acc, offer) => {
      if (!acc[offer.value]) {
        acc[offer.value] = [];
      }
      acc[offer.value].push(offer);
      return acc;
    }, {});

    // Flatten and randomize tied offers
    const sortedOffers = Object.values(offersByValue)
      .flatMap((offers) => (offers.length > 1 ? shuffle(offers) : offers))
      .sort((a, b) => {
        const aValue = parseUnits(a.value, 18);
        const bValue = parseUnits(b.value, 18);
        return Number(bValue - aValue);
      });

    // Split into winning and losing offers
    const winningOffers = sortedOffers.slice(0, 50);
    const losingOffers = sortedOffers.slice(50);

    try {
      // Get token ID for the developer
      const tokenId = await nftContract.getTokenIdForBuilder(developer.id);

      // Process winning offers
      for (const offer of winningOffers) {
        try {
          const bidAmount = ethers.parseUnits(offer.value, 18); // DEV token has 18 decimals
          const developerReward = (bidAmount * BigInt(2)) / BigInt(10); // 20% of bid amount

          // Transfer builder rewards
          await devToken.transfer(developerWallet, developerReward);

          // Mint NFT to the winning bidder
          await nftContract.mintTo(offer.makerWalletAddress, tokenId, 1);

          // Update offer status
          await prisma.draftSeasonOffer.update({
            where: { id: offer.id },
            data: { status: 'success' }
          });

          log.info(`Processed winning offer for ${developer.path}`, {
            offerId: offer.id,
            bidder: offer.makerWalletAddress,
            amount: offer.value
          });
        } catch (error) {
          log.error(`Error processing winning offer ${offer.id}`, { error });
        }
      }

      // Process losing offers - return their bids
      for (const offer of losingOffers) {
        try {
          const bidAmount = ethers.parseUnits(offer.value, 18);

          // Return full bid amount to the bidder
          await devToken.transfer(offer.makerWalletAddress, bidAmount);

          // Update offer status
          await prisma.draftSeasonOffer.update({
            where: { id: offer.id },
            data: { status: 'failed', decentError: { reason: 'Bid not in top 50' } }
          });

          log.info(`Returned bid for losing offer`, {
            offerId: offer.id,
            bidder: offer.makerWalletAddress,
            amount: offer.value
          });
        } catch (error) {
          log.error(`Error processing losing offer ${offer.id}`, { error });
        }
      }
    } catch (error) {
      log.error(`Error processing developer ${developer.path}`, { error });
    }
  }
}
