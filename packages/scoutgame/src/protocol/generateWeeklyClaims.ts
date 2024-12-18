import { log } from '@charmverse/core/log';
import type { Prisma, WeeklyClaims } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProvableClaim } from '@charmverse/core/protocol';
import { generateMerkleTree, getMerkleProofs } from '@charmverse/core/protocol';
import { prettyPrint } from '@packages/utils/strings';
import { v4 as uuid } from 'uuid';
import type { Address } from 'viem';

import { currentSeason, getEndOfSeason } from '../dates';
import { divideTokensBetweenBuilderAndHolders } from '../points/divideTokensBetweenBuilderAndHolders';
import { getWeeklyPointsPoolAndBuilders } from '../points/getWeeklyPointsPoolAndBuilders';
import { findOrCreateWalletUser } from '../users/findOrCreateWalletUser';

import { protocolImplementationWriteClient } from './clients/protocolWriteClients';
import {
  getSablierLockupContract,
  sablierStreamId,
  scoutProtocolBuilderNftContractAddress,
  scoutProtocolChainId
} from './constants';
import type { TokenOwnership } from './resolveTokenOwnership';

type ClaimsBody = {
  leaves: ProvableClaim[];
};

export type WeeklyClaimsTyped = Omit<WeeklyClaims, 'claims' | 'proofsMap'> & {
  claims: ClaimsBody;
  proofsMap: Record<string, string[]>;
};

type WeeklyClaimsCalculated = {
  claims: ProvableClaim[];
  builderEvents: Prisma.BuilderEventCreateManyInput[];
  tokenReceipts: Prisma.TokensReceiptCreateManyInput[];
  weeklyClaimId: string;
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
  const { normalisationFactor, topWeeklyBuilders, weeklyAllocatedPoints } = await getWeeklyPointsPoolAndBuilders({
    week
  });

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
      }
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
      contractAddress: scoutProtocolBuilderNftContractAddress()
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
    topWeeklyBuilders.map(async (builder) => {
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

      // prettyPrint({ owners });

      const { tokensPerScout, tokensForBuilder } = await divideTokensBetweenBuilderAndHolders({
        builderId: builder.builder.id,
        normalisationFactor,
        rank: builder.rank,
        weeklyAllocatedTokens: weeklyAllocatedPoints,
        owners: Object.entries(owners).map(([wallet, balance]) => ({
          wallet: wallet as Address,
          tokens: { default: Number(balance), starter_pack: 0 }
        }))
      });

      const builderEventId = uuid();

      const builderEventInput: Prisma.BuilderEventCreateManyInput = {
        id: builderEventId,
        builderId: builder.builder.id,
        week,
        season: currentSeason,
        type: 'onchain_gems_payout',
        weeklyClaimId
      };

      builderEvents.push(builderEventInput);

      const builderTokenReceiptInput: Prisma.TokensReceiptCreateManyInput = {
        eventId: builderEventId,
        value: tokensForBuilder,
        walletAddress: builderWallet,
        recipientId: builder.builder.id
      };

      const scoutTokenReceipts: Prisma.TokensReceiptCreateManyInput[] = tokensPerScout.map((scoutClaim) => ({
        eventId: builderEventId,
        value: scoutClaim.erc20Tokens,
        walletAddress: scoutClaim.wallet,
        recipientId: walletToScoutId[scoutClaim.wallet]
      }));

      tokenReceipts.push(builderTokenReceiptInput, ...scoutTokenReceipts);

      return {
        tokensPerScout,
        tokensForBuilder: { wallet: builderWallet, amount: tokensForBuilder },
        builderId: builder.builder.id
      };
    })
  );

  const claims: ProvableClaim[] = [
    ...allClaims.map((c) => ({
      address: c.tokensForBuilder.wallet as Address,
      amount: c.tokensForBuilder.amount
    })),
    ...allClaims.flatMap((c) =>
      c.tokensPerScout.map((scoutClaim) => ({
        address: scoutClaim.wallet as Address,
        amount: scoutClaim.erc20Tokens
      }))
    )
  ];

  return { claims, builderEvents, weeklyClaimId, tokenReceipts };
}

/**
 * Generate the claims for a given week
 * @param week - The week to generate claims for
 * @param weeklyClaimsCalculated - Output of calculateWeeklyClaims()
 * @returns The generated claims
 */
export async function generateWeeklyClaims({
  week,
  weeklyClaimsCalculated
}: {
  week: string;
  weeklyClaimsCalculated: WeeklyClaimsCalculated;
}): Promise<{ weeklyClaims: WeeklyClaimsTyped; totalBuilders: number; totalPoints: number }> {
  const existingClaim = await prisma.weeklyClaims.findUnique({
    where: {
      week
    }
  });

  if (existingClaim) {
    throw new Error(`Claims for week ${week} already exist`);
  }

  const { claims, builderEvents, tokenReceipts, weeklyClaimId } = weeklyClaimsCalculated;

  const { rootHash, tree } = generateMerkleTree(claims);

  const proofsMap: Record<Address, string[]> = {};

  for (const claim of claims) {
    const proof = getMerkleProofs(tree, { address: claim.address, amount: claim.amount });

    proofsMap[claim.address] = proof;
  }

  const rootHashWithNullByte = `0x${rootHash}`;

  const claimsBody: ClaimsBody = {
    leaves: claims
  };

  await protocolImplementationWriteClient().setWeeklyMerkleRoot({
    args: {
      weeklyRoot: {
        isoWeek: week,
        // Tokens can be claimed until the end of the season and the next season
        validUntil: Math.round(getEndOfSeason(currentSeason).plus({ weeks: 13 }).toSeconds()),
        merkleRoot: rootHashWithNullByte,
        // Stub definition until we add in IPFS
        merkleTreeUri: `ipfs://scoutgame/merkle-tree/${week}`
      }
    }
  });

  // Fund the protocol contract
  await getSablierLockupContract()
    .claim({
      args: {
        streamId: BigInt(sablierStreamId)
      }
    })
    .catch((error) => {
      log.error(`Error claiming stream ${sablierStreamId}`, error);
    });

  const weeklyClaim = await prisma.$transaction(async (tx) => {
    const _weeklyClaim = await tx.weeklyClaims.create({
      data: {
        id: weeklyClaimId,
        week,
        merkleTreeRoot: rootHashWithNullByte,
        season: currentSeason,
        totalClaimable: claims.reduce((acc, claim) => acc + claim.amount, 0),
        claims: claimsBody,
        proofsMap
      }
    });

    await tx.builderEvent.createMany({
      data: builderEvents
    });
    await tx.tokensReceipt.createMany({
      data: tokenReceipts
    });

    return _weeklyClaim;
  });

  return {
    weeklyClaims: weeklyClaim as WeeklyClaimsTyped,
    totalBuilders: builderEvents.length,
    totalPoints: tokenReceipts.length
  };
}
