import type { PartnerRewardPayoutContractProvider } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getCurrentSeasonStart, getDateFromISOWeek, getSeasonWeekFromISOWeek } from '@packages/dates/utils';
import { formatUnits } from 'viem';

type PartnerRewardBase<T> = T & {
  week: number;
  points: number;
  season: Season;
  tokenDecimals: number;
  txHash: string | null;
  chainId: number;
};

export type OptimismNewScoutPartnerReward = PartnerRewardBase<{
  type: 'optimism_new_scout';
  position: number;
}>;

export type OptimismReferralChampionPartnerReward = PartnerRewardBase<{
  type: 'optimism_referral_champion';
  date: Date | null;
}>;

export type OctantBaseContributionPartnerReward = PartnerRewardBase<{
  type: 'octant_base_contribution';
  prLink: string;
}>;

export type PartnerReward =
  | OptimismNewScoutPartnerReward
  | OptimismReferralChampionPartnerReward
  | OctantBaseContributionPartnerReward;

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
  week: number;
  provider: PartnerRewardPayoutContractProvider;
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
          tokenSymbol: true,
          week: true,
          season: true,
          provider: true
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
    payoutContractId: payoutContract.id,
    week: payoutContract.week,
    season: payoutContract.season,
    provider: payoutContract.provider
  }));

  const unclaimedPartnerRewardsByContractAddress: Record<string, UnclaimedPartnerReward> = {};

  // Combine rewards with the same cid since they are for the same week, just the amount is different
  unclaimedPartnerRewards.forEach((reward) => {
    unclaimedPartnerRewardsByContractAddress[reward.contractAddress] = {
      ...reward,
      amount: reward.amount + (unclaimedPartnerRewardsByContractAddress[reward.contractAddress]?.amount ?? 0),
      week: getSeasonWeekFromISOWeek({
        season: reward.season,
        week: reward.week
      })
    };
  });

  return Object.values(unclaimedPartnerRewardsByContractAddress);
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
    const partnerReward: PartnerRewardBase<any> = {
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
      const week = (payout.meta as unknown as { week: string }).week;
      partnerRewards.push({
        ...partnerReward,
        type: 'optimism_referral_champion' as const,
        date: week ? getDateFromISOWeek(week).toJSDate() : null
      });
    } else if (payout.payoutContract.partner === 'octant_base_contribution') {
      partnerRewards.push({
        ...partnerReward,
        type: 'octant_base_contribution' as const,
        prLink: (payout.meta as unknown as { prLink: string }).prLink
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
