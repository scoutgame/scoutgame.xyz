import { log } from '@charmverse/core/log';
import type { Prisma, WeeklyClaims } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProvableClaim } from '@charmverse/core/protocol';
import { generateMerkleTree } from '@charmverse/core/protocol';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getPointsCountForWeekWithNormalisation } from '@packages/scoutgame/points/getPointsCountForWeekWithNormalisation';
import { findOrCreateWalletUser } from '@packages/users/findOrCreateWalletUser';
import { v4 as uuid } from 'uuid';
import { type Address } from 'viem';

import { divideTokensBetweenBuilderAndHolders } from '../points/divideTokensBetweenBuilderAndHolders';

import { scoutProtocolBuilderNftContractAddress, scoutProtocolChainId, devTokenDecimals } from './constants';
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
  tokenBalances,
  nftContractAddress = scoutProtocolBuilderNftContractAddress
}: {
  week: string;
  tokenBalances: TokenOwnership;
  nftContractAddress?: string;
}): Promise<WeeklyClaimsCalculated> {
  const { normalisationFactor, topWeeklyBuilders, weeklyAllocatedPoints } =
    await getPointsCountForWeekWithNormalisation({
      week,
      useOnchainLeaderboard: true
    });

  const season = getCurrentSeasonStart(week);

  const builderEvents: Prisma.BuilderEventCreateManyInput[] = [];
  const tokenReceipts: Prisma.TokensReceiptCreateManyInput[] = [];
  const weeklyClaimId = uuid();

  // Get unique list of wallet addresses from token balances
  const uniqueWallets = new Set<string>();
  Object.values(tokenBalances).forEach((balanceMap) => {
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
            // Just in case we forgot to lowercase the wallet address somewhere
            mode: 'insensitive'
          }
        }
      },
      deletedAt: null
    },
    include: {
      wallets: true
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
      contractAddress: nftContractAddress
    },
    select: {
      tokenId: true,
      builderId: true,
      builder: {
        select: {
          wallets: true
        }
      }
    }
  });

  const allClaims = await Promise.all(
    topWeeklyBuilders
      // We only want to issue claims for builders that have sold at least one NFT
      .filter(
        (builder) =>
          !!tokenBalances[builderNfts.find((nft) => nft.builderId === builder.builder.id)!.tokenId.toString()]
      )
      .sort((a, b) => a.rank - b.rank)
      .map(async (builder, index) => {
        const builderNft = builderNfts.find((nft) => nft.builderId === builder.builder.id);

        if (!builderNft) {
          throw new Error(`Builder ${builder.builder.id} does not have an NFT`);
        }

        const builderWallet = builderNft.builder.wallets[0].address.toLowerCase();

        if (!builderWallet) {
          throw new Error(`Builder ${builder.builder.id} with token id ${builderNft.tokenId} does not have a wallet`);
        }

        // Edge case if the builder has no nfts sold
        const owners = tokenBalances[builderNft.tokenId.toString()] || {};

        const ownersByWallet = Object.entries(owners).map(([wallet, balance]) => ({
          wallet: wallet as Address,
          totalNft: Number(balance),
          totalStarter: 0
        }));

        const ownersByScoutId = Object.entries(owners).map(([scoutId, balance]) => ({
          scoutId,
          totalNft: Number(balance),
          totalStarter: 0
        }));

        const { tokensPerScoutByWallet, tokensForBuilder } = divideTokensBetweenBuilderAndHolders({
          builderId: builder.builder.id,
          normalisationFactor,
          rank: index + 1,
          weeklyAllocatedTokens: weeklyAllocatedPoints,
          owners: { byWallet: ownersByWallet, byScoutId: ownersByScoutId }
        });

        const builderEventId = uuid();

        const builderEventInput: Prisma.BuilderEventCreateManyInput = {
          id: builderEventId,
          builderId: builder.builder.id,
          week,
          season,
          type: 'gems_payout',
          weeklyClaimId
        };

        builderEvents.push(builderEventInput);

        const builderTokenReceiptInput: Prisma.TokensReceiptCreateManyInput = {
          eventId: builderEventId,
          value: (BigInt(tokensForBuilder) * BigInt(10 ** devTokenDecimals)).toString(),
          recipientWalletAddress: builderWallet
        };

        const scoutTokenReceipts: Prisma.TokensReceiptCreateManyInput[] = tokensPerScoutByWallet.map(
          (scoutClaim) =>
            ({
              eventId: builderEventId,
              // Convert decimal value to integer first by multiplying by 100 (2 decimal places)
              // Then add 16 more decimals to reach 18 total decimals for $SCOUT token
              value: (BigInt(Math.round(scoutClaim.erc20Tokens * 100)) * BigInt(10 ** 16)).toString(),
              recipientWalletAddress: scoutClaim.wallet
            }) as Prisma.TokensReceiptCreateManyInput
        );

        tokenReceipts.push(builderTokenReceiptInput, ...scoutTokenReceipts);

        return {
          tokensPerScoutByWallet,
          tokensForBuilder: { wallet: builderWallet, amount: tokensForBuilder },
          builderId: builder.builder.id
        };
      })
  );

  // Aggregate amounts by wallet address
  const claimsByWallet = new Map<string, number>();

  // Add builder claims
  allClaims.forEach((c) => {
    const wallet = c.tokensForBuilder.wallet as string;
    claimsByWallet.set(wallet, (claimsByWallet.get(wallet) || 0) + c.tokensForBuilder.amount);
  });

  // Add scout claims
  allClaims.forEach((c) => {
    c.tokensPerScoutByWallet.forEach((scoutClaim) => {
      const wallet = scoutClaim.wallet as string;
      claimsByWallet.set(wallet, (claimsByWallet.get(wallet) || 0) + scoutClaim.erc20Tokens);
    });
  });

  // Convert to final claims array
  const claims: ProvableClaim[] = Array.from(claimsByWallet.entries()).map(([address, amount]) => ({
    address: address as Address,
    amount: (BigInt(amount) * BigInt(10 ** devTokenDecimals)).toString()
  }));

  const merkleProofs = generateMerkleTree(claims);

  return { claims, builderEvents, weeklyClaimId, tokenReceipts, merkleProofs };
}
