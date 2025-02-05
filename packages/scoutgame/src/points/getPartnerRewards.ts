import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getCurrentSeasonStart, getSeasonWeekFromISOWeek } from '@packages/dates/utils';

type PartnerRewardBase = {
  week: number;
  points: number;
  type: 'optimism_new_scout_partner' | 'optimism_top_referrer';
  season: Season;
};

export type OptimismNewScoutPartnerReward = PartnerRewardBase & {
  type: 'optimism_new_scout_partner';
  partner: string;
  position: number;
};

export type OptimismTopReferrerReward = PartnerRewardBase & {
  type: 'optimism_top_referrer';
  partner: string;
  date: string;
};

export type PartnerReward = OptimismNewScoutPartnerReward | OptimismTopReferrerReward;

export async function getUnclaimedPartnerRewards({ userId }: { userId: string }) {
  const partnerRewards = await prisma.partnerRewardPayout.findMany({
    where: {
      payoutContract: {
        season: getCurrentSeasonStart()
      },
      userId,
      claimedAt: null
    },
    select: {
      id: true,
      amount: true,
      payoutContract: {
        select: {
          partner: true
        }
      }
    }
  });

  return partnerRewards.map((payout) => ({
    id: payout.id,
    amount: payout.amount,
    partner: payout.payoutContract.partner
  }));
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
  const optimismNewScoutPartnerRewards: OptimismNewScoutPartnerReward[] = [];
  const optimismTopReferrerRewards: OptimismTopReferrerReward[] = [];

  const partnerRewardPayouts = await prisma.partnerRewardPayout.findMany({
    where: {
      userId,
      claimedAt: isClaimed ? { not: null } : { equals: null },
      payoutContract: {
        partner: {
          in: ['optimism_new_scout', 'optimism_top_referrer']
        },
        season
      }
    },
    select: {
      amount: true,
      payoutContract: {
        select: {
          week: true,
          partner: true
        }
      }
    }
  });

  partnerRewardPayouts.forEach((payout) => {
    if (payout.payoutContract.partner === 'optimism_new_scout') {
      optimismNewScoutPartnerRewards.push({
        partner: payout.payoutContract.partner,
        points: Number(payout.amount),
        type: 'optimism_new_scout_partner',
        season,
        position: 1,
        week: getSeasonWeekFromISOWeek({
          season,
          week: payout.payoutContract.week
        })
      });
    } else if (payout.payoutContract.partner === 'optimism_top_referrer') {
      optimismTopReferrerRewards.push({
        partner: payout.payoutContract.partner,
        points: Number(payout.amount),
        type: 'optimism_top_referrer',
        season,
        date: new Date().toISOString(),
        week: getSeasonWeekFromISOWeek({
          season,
          week: payout.payoutContract.week
        })
      });
    }
  });

  return [...optimismNewScoutPartnerRewards, ...optimismTopReferrerRewards].sort((a, b) => {
    if (a.week === b.week) {
      return b.points - a.points;
    }
    return b.week - a.week;
  });
}
