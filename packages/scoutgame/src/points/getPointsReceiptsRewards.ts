import type { BuilderEvent, NFTPurchaseEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { seasons } from '@packages/dates/config';
import { getCurrentSeasonStart, getPreviousSeason, getSeasonWeekFromISOWeek } from '@packages/dates/utils';
import { getPlatform } from '@packages/utils/platform';
import { isTruthy } from '@packages/utils/types';
import { formatUnits } from 'viem';

import { devTokenDecimals } from '../protocol/constants';

type PointsReceiptRewardType = 'builder' | 'sold_nfts' | 'leaderboard_rank' | 'previous_season' | 'matchup_winner';

type PointsReceiptRewardBase<T> = T & {
  points: number;
  type: PointsReceiptRewardType;
  season: Season;
};

export type BuilderPointsReceiptReward = PointsReceiptRewardBase<{
  type: 'builder';
  week: number;
  bonusPartners: string[];
}>;

export type SoldNftsPointsReceiptReward = PointsReceiptRewardBase<{
  type: 'sold_nfts';
  week: number;
  quantity: number;
}>;

export type LeaderboardRankPointsReceiptReward = PointsReceiptRewardBase<{
  type: 'leaderboard_rank';
  week: number;
  rank: number;
}>;

export type MatchupWinnerPointsReceiptReward = PointsReceiptRewardBase<{
  type: 'matchup_winner';
  opAmount: number;
  week: number;
}>;

export type PreviousSeasonPointsReceiptsReward = PointsReceiptRewardBase<{
  type: 'previous_season';
  title: string;
}>;

export type PointsReceiptReward =
  | BuilderPointsReceiptReward
  | SoldNftsPointsReceiptReward
  | LeaderboardRankPointsReceiptReward
  | PreviousSeasonPointsReceiptsReward
  | MatchupWinnerPointsReceiptReward;

export async function getPointsReceiptsRewards({
  isClaimed,
  userId,
  season = getCurrentSeasonStart()
}: {
  userId: string;
  isClaimed: boolean;
  season?: string;
}): Promise<PointsReceiptReward[]> {
  const previousSeason = getPreviousSeason(season);
  const claimableSeasons = [previousSeason, season].filter(isTruthy);
  if (claimableSeasons.length === 0) {
    throw new Error(`No seasons found to claim points: ${season}`);
  }

  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      claimedAt: isClaimed ? { not: null } : { equals: null },
      event: {
        season: {
          // Can only claim points for this season and previous seasons
          in: isClaimed ? seasons.map((s) => s.start) : claimableSeasons
        }
      },
      value: {
        gt: 0
      }
    },
    select: {
      value: true,
      recipientId: true,
      event: {
        select: {
          week: true,
          season: true,
          type: true,
          bonusPartner: true,
          builderId: true,
          nftPurchaseEvent: {
            select: {
              tokensPurchased: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const matchupRewards = await prisma.partnerRewardPayout.findMany({
    where: {
      payoutContract: {
        partner: 'matchup_rewards',
        season
      },
      wallet: {
        scoutId: userId
      }
    },
    select: {
      amount: true,
      payoutContract: {
        select: {
          week: true,
          tokenDecimals: true
        }
      }
    }
  });

  const tokensReceipts = await prisma.tokensReceipt.findMany({
    where: {
      recipientWallet: {
        scoutId: userId
      },
      claimedAt: isClaimed ? { not: null } : { equals: null }
    },
    select: {
      value: true,
      recipientWalletAddress: true,
      recipientWallet: {
        select: {
          scoutId: true
        }
      },
      event: {
        select: {
          week: true,
          season: true,
          type: true,
          bonusPartner: true,
          builderId: true,
          nftPurchaseEvent: {
            select: {
              tokensPurchased: true
            }
          }
        }
      }
    }
  });

  const builderRewards: Record<string, BuilderPointsReceiptReward> = {};
  const soldNftRewards: Record<string, SoldNftsPointsReceiptReward> = {};
  const leaderboardRankRewards: Record<string, LeaderboardRankPointsReceiptReward> = {};
  const matchupWinnerRewards: Record<string, MatchupWinnerPointsReceiptReward> = {};

  const leaderboardRankWeeks = Array.from(
    new Set([
      ...pointsReceipts
        .filter((pr) => pr.event.type === 'gems_payout' && pr.recipientId === userId)
        .map((pr) => pr.event.week),
      ...tokensReceipts.filter((tr) => tr.recipientWallet?.scoutId === userId).map((tr) => tr.event.week)
    ])
  );

  const weeklyRankRecord: Record<string, number | null> = {};
  const weeklyStats = await prisma.userWeeklyStats.findMany({
    where: {
      week: {
        in: leaderboardRankWeeks
      },
      userId
    },
    select: {
      rank: true,
      week: true
    }
  });

  for (const stat of weeklyStats) {
    weeklyRankRecord[stat.week] = stat.rank;
  }

  const bonusPartners: Set<string> = new Set();

  const pointsBySeason: Record<Season, number> = {};

  pointsReceipts.forEach((receipt) => {
    const _season = receipt.event.season as Season;
    pointsBySeason[_season] = (pointsBySeason[_season] ?? 0) + receipt.value;
  });

  tokensReceipts.forEach((receipt) => {
    const _season = receipt.event.season as Season;
    pointsBySeason[_season] =
      (pointsBySeason[_season] ?? 0) + Number(BigInt(receipt.value) / BigInt(10 ** devTokenDecimals));
  });

  const previousSeasons: PreviousSeasonPointsReceiptsReward[] = seasons
    .slice()
    .sort()
    .filter((s) => s.start < season)
    .map((s) => ({
      points: pointsBySeason[s.start],
      type: 'previous_season',
      title: s.title,
      season: s.start
    }));

  const currentSeasonReceipts: {
    value: number;
    event: Pick<BuilderEvent, 'week' | 'season' | 'type' | 'bonusPartner' | 'builderId'> & {
      nftPurchaseEvent?: Pick<NFTPurchaseEvent, 'tokensPurchased'> | null;
    };
    recipientId: string;
  }[] = [];

  pointsReceipts
    .filter((pr) => pr.event.season === season && pr.recipientId === userId)
    .forEach((pr) => {
      currentSeasonReceipts.push({
        value: pr.value,
        event: pr.event,
        recipientId: pr.recipientId!
      });
    });

  tokensReceipts
    .filter((tr) => tr.event.season === season && tr.recipientWallet?.scoutId === userId)
    .forEach((tr) => {
      currentSeasonReceipts.push({
        value: Number(BigInt(tr.value) / BigInt(10 ** devTokenDecimals)),
        event: tr.event,
        recipientId: tr.recipientWallet!.scoutId!
      });
    });

  for (const receipt of currentSeasonReceipts) {
    const points = receipt.value;
    const week = receipt.event.week;
    const weeklyRank = weeklyRankRecord[week];
    const weekNumber = getSeasonWeekFromISOWeek({
      season: receipt.event.season,
      week
    });

    if (receipt.event.type === 'nft_purchase' && receipt.event.nftPurchaseEvent) {
      // points received from selling NFTs
      if (!soldNftRewards[week]) {
        soldNftRewards[week] = {
          points: 0,
          quantity: 0,
          week: weekNumber,
          season: receipt.event.season as Season,
          type: 'sold_nfts'
        };
      }
      soldNftRewards[week].points += receipt.value;
      soldNftRewards[week].quantity += receipt.event.nftPurchaseEvent.tokensPurchased;
    } else if (receipt.event.type === 'gems_payout') {
      // points received as a scout
      if (receipt.event.builderId !== receipt.recipientId) {
        if (!builderRewards[week]) {
          builderRewards[week] = {
            points: 0,
            week: weekNumber,
            type: 'builder',
            season: receipt.event.season as Season,
            bonusPartners: []
          };
        }
        builderRewards[week].points += points;
        const bonusPartner = receipt.event.bonusPartner;
        if (bonusPartner) {
          builderRewards[week].bonusPartners.push(bonusPartner);
          bonusPartners.add(bonusPartner);
        }
      } else if (weeklyRank) {
        // points received as a builder
        if (!leaderboardRankRewards[week]) {
          leaderboardRankRewards[week] = {
            points: 0,
            rank: weeklyRank,
            week: weekNumber,
            season: receipt.event.season as Season,
            type: 'leaderboard_rank'
          };
        }
        leaderboardRankRewards[week].points += points;
      }
    } else if (receipt.event.type === 'matchup_winner') {
      // points received as a matchup winner
      const opPayout = matchupRewards.find((r) => r.payoutContract.week === week);
      matchupWinnerRewards[week] = {
        points,
        opAmount: opPayout ? Number(formatUnits(BigInt(opPayout.amount), opPayout.payoutContract.tokenDecimals)) : 0,
        week: weekNumber,
        season: receipt.event.season as Season,
        type: 'matchup_winner'
      };
    }
  }

  const currentSeasonRewards = [
    ...Object.values(builderRewards),
    ...Object.values(soldNftRewards),
    ...Object.values(leaderboardRankRewards),
    ...Object.values(matchupWinnerRewards)
  ].sort((a, b) => {
    if (a.week === b.week) {
      return b.points - a.points;
    }
    return b.week - a.week;
  });

  return [...currentSeasonRewards, ...previousSeasons.reverse()].filter((reward) => reward.points);
}
