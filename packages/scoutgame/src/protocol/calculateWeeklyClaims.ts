import { log } from '@charmverse/core/log';
import type { Prisma, WeeklyClaims } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProvableClaim } from '@charmverse/core/protocol';
import { generateMerkleTree } from '@charmverse/core/protocol';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { findOrCreateWalletUser } from '@packages/users/findOrCreateWalletUser';
import { v4 as uuid } from 'uuid';
import { type Address } from 'viem';

import { divideTokensBetweenDeveloperAndHolders } from '../tokens/divideTokensBetweenDeveloperAndHolders';
import { getTokensCountForWeekWithNormalisation } from '../tokens/getTokensCountForWeekWithNormalisation';

import { scoutProtocolChainId } from './constants';
import type { TokenOwnership } from './resolveTokenOwnership';

type ClaimsBody = {
  leaves: ProvableClaim[];
};

export type WeeklyClaimsTyped = Omit<WeeklyClaims, 'claims' | 'proofsMap'> & {
  claims: ClaimsBody;
  proofsMap: Record<string, string[]>;
};

export type WeeklyClaimsCalculated = {
  claims: ProvableClaim[];
  builderEvents: Prisma.BuilderEventCreateManyInput[];
  tokenReceipts: Prisma.TokensReceiptCreateManyInput[];
  weeklyClaimId: string;
  merkleProofs: ReturnType<typeof generateMerkleTree>;
};

/**
 * Calculate the claims for a given week
 * @param week - The week to calculate claims for
 * @param tokenBalances - Output of resolveTokenOwnership()
 * @returns The calculated claims
 */
export async function calculateWeeklyClaims({
  week,
  tokenBalances
}: {
  week: string;
  tokenBalances: TokenOwnership;
}): Promise<WeeklyClaimsCalculated> {
  const { normalisationFactor, normalisationScale, topWeeklyDevelopers, weeklyAllocatedTokens } =
    await getTokensCountForWeekWithNormalisation({
      week
    });

  const season = getCurrentSeasonStart(week);

  const builderEvents: Prisma.BuilderEventCreateManyInput[] = [];
  const tokenReceipts: Prisma.TokensReceiptCreateManyInput[] = [];
  const weeklyClaimId = uuid();

  // Get unique list of wallet addresses from token balances
  const uniqueWallets = new Set<string>();
  [...Object.values(tokenBalances.standard), ...Object.values(tokenBalances.starter)].forEach((balanceMap) => {
    Object.keys(balanceMap).forEach((wallet) => {
      uniqueWallets.add(wallet.toLowerCase());
    });
  });

  // Find existing scouts with these wallets
  const existingScouts = await prisma.scout.findMany({
    where: {
      wallets: {
        some: {
          address: {
            in: Array.from(uniqueWallets),
            mode: 'insensitive'
          }
        }
      },
      deletedAt: null
    },
    select: {
      id: true,
      wallets: {
        select: {
          address: true,
          primary: true
        }
      }
    }
  });

  const walletToScoutId = existingScouts.reduce<Record<Address, string>>((acc, scout) => {
    scout.wallets.forEach((wallet) => {
      acc[wallet.address.toLowerCase() as Address] = scout.id;
    });
    return acc;
  }, {});

  // Find wallets that don't have an associated scout account
  const walletsWithoutScout = Array.from(uniqueWallets).filter(
    (wallet) => !walletToScoutId[wallet.toLowerCase() as Address]
  );

  if (walletsWithoutScout.length > 0) {
    log.warn(`Found ${walletsWithoutScout.length} wallets without an associated scout account`);

    for (let i = 0; i < walletsWithoutScout.length; i++) {
      const wallet = walletsWithoutScout[i];
      const newScout = await findOrCreateWalletUser({
        wallet: wallet.toLowerCase() as Address
      });

      walletToScoutId[wallet.toLowerCase() as Address] = newScout.id;
    }
  }

  const builderNfts = await prisma.builderNft.findMany({
    where: {
      chainId: scoutProtocolChainId,
      season
    },
    select: {
      tokenId: true,
      nftType: true,
      builderId: true,
      builder: {
        select: {
          wallets: {
            where: {
              primary: true
            },
            select: {
              address: true
            }
          }
        }
      }
    }
  });

  const claimsPerDeveloper = topWeeklyDevelopers
    .filter((developer) => {
      const starterNft = builderNfts.find(
        (nft) => nft.builderId === developer.developer.id && nft.nftType === 'starter_pack'
      );
      const standardNft = builderNfts.find(
        (nft) => nft.builderId === developer.developer.id && nft.nftType === 'default'
      );
      const starterBalance = starterNft ? !!tokenBalances.starter[starterNft.tokenId.toString()] : false;
      const standardBalance = standardNft ? !!tokenBalances.standard[standardNft.tokenId.toString()] : false;
      return starterBalance || standardBalance;
    })
    .sort((a, b) => a.rank - b.rank)
    .map((developer, index) => {
      const developerNft = builderNfts.find((nft) => nft.builderId === developer.developer.id);

      if (!developerNft) {
        throw new Error(`Developer ${developer.developer.id} does not have an NFT`);
      }

      const developerWallet = developerNft.builder.wallets[0].address.toLowerCase();

      if (!developerWallet) {
        throw new Error(
          `Developer ${developer.developer.id} with token id ${developerNft.tokenId} does not have a wallet`
        );
      }

      // Edge case if the builder has no nfts sold
      const starterOwners = tokenBalances.starter[developerNft.tokenId.toString()] || {};
      const standardOwners = tokenBalances.standard[developerNft.tokenId.toString()] || {};

      const ownersByScoutIdRecord: Record<string, { totalNft: number; totalStarter: number }> = {};

      // Aggregate starter balances by scout ID
      for (const [wallet, balance] of Object.entries(starterOwners)) {
        const scoutId = walletToScoutId[wallet.toLowerCase() as Address];
        if (scoutId) {
          if (!ownersByScoutIdRecord[scoutId]) {
            ownersByScoutIdRecord[scoutId] = {
              totalNft: 0,
              totalStarter: balance
            };
          } else {
            ownersByScoutIdRecord[scoutId].totalStarter += balance;
          }
        }
      }

      for (const [wallet, balance] of Object.entries(standardOwners)) {
        const scoutId = walletToScoutId[wallet.toLowerCase() as Address];
        if (scoutId) {
          if (!ownersByScoutIdRecord[scoutId]) {
            ownersByScoutIdRecord[scoutId] = {
              totalNft: balance,
              totalStarter: 0
            };
          } else {
            ownersByScoutIdRecord[scoutId].totalNft += Number(balance);
          }
        }
      }

      const ownersByScoutId = Object.entries(ownersByScoutIdRecord).map(([scoutId, balance]) => ({
        scoutId,
        totalNft: balance.totalNft,
        totalStarter: balance.totalStarter
      }));

      const { tokensPerScoutByScoutId, tokensForDeveloper } = divideTokensBetweenDeveloperAndHolders({
        normalisationFactor,
        normalisationScale,
        rank: index + 1,
        weeklyAllocatedTokens,
        owners: { byScoutId: ownersByScoutId }
      });

      const builderEventId = uuid();

      const builderEventInput: Prisma.BuilderEventCreateManyInput = {
        id: builderEventId,
        builderId: developer.developer.id,
        week,
        season,
        type: 'gems_payout',
        weeklyClaimId
      };

      builderEvents.push(builderEventInput);

      const developerTokenReceiptInput: Prisma.TokensReceiptCreateManyInput = {
        eventId: builderEventId,
        value: tokensForDeveloper.toString(),
        recipientWalletAddress: developerWallet
      };

      // Get primary wallet for each scout
      const scoutTokenReceipts: Prisma.TokensReceiptCreateManyInput[] = tokensPerScoutByScoutId.map((scoutClaim) => {
        const scout = existingScouts.find((s) => s.id === scoutClaim.scoutId);
        const primaryWallet = scout?.wallets.find((w) => w.primary)?.address.toLowerCase();

        if (!primaryWallet) {
          throw new Error(`No primary wallet found for scout ${scoutClaim.scoutId}`);
        }

        return {
          eventId: builderEventId,
          value: scoutClaim.erc20Tokens.toString(),
          recipientWalletAddress: primaryWallet
        } as Prisma.TokensReceiptCreateManyInput;
      });

      tokenReceipts.push(developerTokenReceiptInput, ...scoutTokenReceipts);

      return {
        tokensPerScoutByScoutId,
        tokensForDeveloper: { wallet: developerWallet, amount: tokensForDeveloper },
        developerId: developer.developer.id
      };
    });

  // Aggregate amounts by wallet address
  const claimsByWallet = new Map<string, bigint>();

  // Add builder claims
  claimsPerDeveloper.forEach((c) => {
    const wallet = c.tokensForDeveloper.wallet as string;
    claimsByWallet.set(wallet, (claimsByWallet.get(wallet) || BigInt(0)) + c.tokensForDeveloper.amount);
  });

  // Add scout claims
  claimsPerDeveloper.forEach((c) => {
    c.tokensPerScoutByScoutId.forEach((scoutClaim) => {
      const scout = existingScouts.find((s) => s.id === scoutClaim.scoutId);
      const wallet = scout?.wallets.find((w) => w.primary) || scout?.wallets[0];
      const address = wallet?.address.toLowerCase();
      if (address) {
        claimsByWallet.set(address, (claimsByWallet.get(address) || BigInt(0)) + scoutClaim.erc20Tokens);
      } else {
        log.warn(`No wallet found to pay out scout`, { userId: scoutClaim.scoutId });
      }
    });
  });

  // Convert to final claims array
  const claims: ProvableClaim[] = Array.from(claimsByWallet.entries()).map(([address, amount]) => ({
    address: address as Address,
    amount: amount.toString()
  }));

  const merkleProofs = generateMerkleTree(claims);

  return { claims, builderEvents, weeklyClaimId, tokenReceipts, merkleProofs };
}
