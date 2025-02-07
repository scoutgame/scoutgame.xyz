import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getCurrentSeasonStart, getSeasonWeekFromISOWeek } from '@packages/dates/utils';
import { formatUnits } from 'viem';

type PartnerRewardBase = {
  week: number;
  points: number;
  season: Season;
  tokenDecimals: number;
  txHash: string | null;
  chainId: number;
};

export type OptimismNewScoutPartnerReward = PartnerRewardBase & {
  type: 'optimism_new_scout';
  position: number;
};

export type OptimismReferralChampionReward = PartnerRewardBase & {
  type: 'optimism_referral_champion';
  date: Date;
};

export type PartnerReward = OptimismNewScoutPartnerReward | OptimismReferralChampionReward;

export type UnclaimedPartnerReward = {
  id: string;
  amount: number;
  partner: string;
  tokenDecimals: number;
  tokenSymbol: string;
  ipfsCid: string;
  chainId: number;
  contractAddress: string;
  recipientAddress: string;
  payoutContractId: string;
};

export async function getUnclaimedPartnerRewards({ userId }: { userId: string }): Promise<UnclaimedPartnerReward[]> {
  const partnerRewards = await prisma.partnerRewardPayout.findMany({
    where: {
      payoutContract: {
        season: getCurrentSeasonStart()
      },
      wallet: {
        scout: {
          id: userId
        }
      },
      deletedAt: null,
      claimedAt: null
    },
    select: {
      id: true,
      amount: true,
      walletAddress: true,
      payoutContract: {
        select: {
          id: true,
          partner: true,
          tokenDecimals: true,
          contractAddress: true,
          chainId: true,
          ipfsCid: true,
          tokenSymbol: true
        }
      }
    }
  });

  const unclaimedPartnerRewards = partnerRewards.map(({ payoutContract, id, amount, walletAddress }) => ({
    id,
    amount: Number(formatUnits(BigInt(amount), payoutContract.tokenDecimals)),
    partner: payoutContract.partner,
    tokenDecimals: payoutContract.tokenDecimals,
    tokenSymbol: payoutContract.tokenSymbol,
    contractAddress: payoutContract.contractAddress,
    ipfsCid: payoutContract.ipfsCid,
    chainId: payoutContract.chainId,
    recipientAddress: walletAddress,
    payoutContractId: payoutContract.id
  }));

  const unclaimedPartnerRewardsByCid: Record<string, UnclaimedPartnerReward> = {};

  // Combine rewards with the same cid since they are for the same week, just the amount is different
  unclaimedPartnerRewards.forEach((reward) => {
    unclaimedPartnerRewardsByCid[reward.contractAddress] = {
      ...reward,
      amount: reward.amount + (unclaimedPartnerRewardsByCid[reward.contractAddress]?.amount ?? 0)
    };
  });

  return Object.values(unclaimedPartnerRewardsByCid);
}

export async function getPartnerRewards({
  userId,
  isClaimed,
  season
}: {
  userId: string;
  isClaimed: boolean;
  season: string;
}) {
  const partnerRewards: PartnerReward[] = [];

  const partnerRewardPayouts = await prisma.partnerRewardPayout.findMany({
    where: {
      wallet: {
        scout: {
          id: userId
        }
      },
      claimedAt: isClaimed ? { not: null } : { equals: null },
      payoutContract: {
        season
      }
    },
    select: {
      amount: true,
      meta: true,
      txHash: true,
      payoutContract: {
        select: {
          week: true,
          partner: true,
          tokenDecimals: true,
          chainId: true
        }
      }
    }
  });

  partnerRewardPayouts.forEach((payout) => {
    const partnerReward: PartnerRewardBase = {
      points: Number(formatUnits(BigInt(payout.amount), payout.payoutContract.tokenDecimals)),
      season,
      week: getSeasonWeekFromISOWeek({
        season,
        week: payout.payoutContract.week
      }),
      tokenDecimals: payout.payoutContract.tokenDecimals,
      txHash: payout.txHash,
      chainId: payout.payoutContract.chainId
    };

    if (payout.payoutContract.partner === 'optimism_new_scout') {
      partnerRewards.push({
        ...partnerReward,
        type: 'optimism_new_scout' as const,
        position: (payout.meta as { position: number }).position
      });
    } else if (payout.payoutContract.partner === 'optimism_referral_champion') {
      partnerRewards.push({
        ...partnerReward,
        type: 'optimism_referral_champion' as const,
        date: (payout.meta as unknown as { date: Date }).date
      });
    }
  });

  return partnerRewards.sort((a, b) => {
    if (a.week === b.week) {
      return b.points - a.points;
    }
    return b.week - a.week;
  });
}
