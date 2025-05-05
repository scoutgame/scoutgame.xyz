import type { BuilderEvent, NFTPurchaseEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getCurrentSeasonStart, getPreviousSeason, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { isTruthy } from '@packages/utils/types';
import { formatUnits } from 'viem';

import { devTokenDecimals } from '../protocol/constants';

type TokensReceiptRewardType = 'developer' | 'sold_nfts' | 'leaderboard_rank' | 'matchup_winner';

type TokensReceiptRewardBase<T> = T & {
  tokens: number;
  type: TokensReceiptRewardType;
  season: Season;
};

export type DeveloperTokensReceiptReward = TokensReceiptRewardBase<{
  type: 'developer';
  week: number;
  bonusPartners: string[];
}>;

export type SoldNftsTokensReceiptReward = TokensReceiptRewardBase<{
  type: 'sold_nfts';
  week: number;
  quantity: number;
}>;

export type LeaderboardRankTokensReceiptReward = TokensReceiptRewardBase<{
  type: 'leaderboard_rank';
  week: number;
  rank: number;
}>;

export type MatchupWinnerTokensReceiptReward = TokensReceiptRewardBase<{
  type: 'matchup_winner';
  opAmount: number;
  week: number;
}>;

export type TokensReceiptReward =
  | DeveloperTokensReceiptReward
  | SoldNftsTokensReceiptReward
  | LeaderboardRankTokensReceiptReward
  | MatchupWinnerTokensReceiptReward;

export async function getTokensReceiptsRewards({
  isClaimed,
  userId,
  season = getCurrentSeasonStart()
}: {
  userId: string;
  isClaimed: boolean;
  season?: string;
}): Promise<TokensReceiptReward[]> {
  const previousSeason = getPreviousSeason(season);
  const claimableSeasons = [previousSeason, season].filter(isTruthy);
  if (claimableSeasons.length === 0) {
    throw new Error(`No seasons found to claim points: ${season}`);
  }

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

  const developerRewards: Record<string, DeveloperTokensReceiptReward> = {};
  const soldNftRewards: Record<string, SoldNftsTokensReceiptReward> = {};
  const leaderboardRankRewards: Record<string, LeaderboardRankTokensReceiptReward> = {};
  const matchupWinnerRewards: Record<string, MatchupWinnerTokensReceiptReward> = {};

  const leaderboardRankWeeks = Array.from(
    new Set(tokensReceipts.filter((tr) => tr.recipientWallet?.scoutId === userId).map((tr) => tr.event.week))
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

  const tokensBySeason: Record<Season, number> = {};

  tokensReceipts.forEach((receipt) => {
    const _season = receipt.event.season as Season;
    tokensBySeason[_season] =
      (tokensBySeason[_season] ?? 0) + Number(BigInt(receipt.value) / BigInt(10 ** devTokenDecimals));
  });

  const currentSeasonReceipts: {
    value: number;
    event: Pick<BuilderEvent, 'week' | 'season' | 'type' | 'bonusPartner' | 'builderId'> & {
      nftPurchaseEvent?: Pick<NFTPurchaseEvent, 'tokensPurchased'> | null;
    };
    recipientId: string;
  }[] = [];

  tokensReceipts
    .filter((tr) => tr.event.season === season && tr.recipientWallet?.scoutId === userId)
    .forEach((tr) => {
      currentSeasonReceipts.push({
        value: Number(formatUnits(BigInt(tr.value), devTokenDecimals)),
        event: tr.event,
        recipientId: tr.recipientWallet!.scoutId!
      });
    });

  for (const receipt of currentSeasonReceipts) {
    const tokens = receipt.value;
    const week = receipt.event.week;
    const weeklyRank = weeklyRankRecord[week];
    const weekNumber = getCurrentSeasonWeekNumber(week);

    if (receipt.event.type === 'nft_purchase' && receipt.event.nftPurchaseEvent) {
      if (!soldNftRewards[week]) {
        soldNftRewards[week] = {
          tokens: 0,
          quantity: 0,
          week: weekNumber,
          season: receipt.event.season as Season,
          type: 'sold_nfts'
        };
      }
      soldNftRewards[week].tokens += tokens;
      soldNftRewards[week].quantity += receipt.event.nftPurchaseEvent.tokensPurchased;
    } else if (receipt.event.type === 'gems_payout') {
      if (receipt.event.builderId !== receipt.recipientId) {
        if (!developerRewards[week]) {
          developerRewards[week] = {
            tokens: 0,
            week: weekNumber,
            type: 'developer',
            season: receipt.event.season as Season,
            bonusPartners: []
          };
        }
        developerRewards[week].tokens += tokens;
        const bonusPartner = receipt.event.bonusPartner;
        if (bonusPartner) {
          developerRewards[week].bonusPartners.push(bonusPartner);
          bonusPartners.add(bonusPartner);
        }
      } else if (weeklyRank) {
        // points received as a builder
        if (!leaderboardRankRewards[week]) {
          leaderboardRankRewards[week] = {
            tokens: 0,
            rank: weeklyRank,
            week: weekNumber,
            season: receipt.event.season as Season,
            type: 'leaderboard_rank'
          };
        }
        leaderboardRankRewards[week].tokens += tokens;
      }
    } else if (receipt.event.type === 'matchup_winner') {
      // points received as a matchup winner
      const opPayout = matchupRewards.find((r) => r.payoutContract.week === week);
      matchupWinnerRewards[week] = {
        // TODO: tokens receipt from payout
        tokens: 0,
        opAmount: opPayout ? Number(formatUnits(BigInt(opPayout.amount), opPayout.payoutContract.tokenDecimals)) : 0,
        week: weekNumber,
        season: receipt.event.season as Season,
        type: 'matchup_winner'
      };
    }
  }

  const currentSeasonRewards = [
    ...Object.values(developerRewards),
    ...Object.values(soldNftRewards),
    ...Object.values(leaderboardRankRewards),
    ...Object.values(matchupWinnerRewards)
  ].sort((a, b) => {
    if (a.week === b.week) {
      return b.tokens - a.tokens;
    }
    return b.week - a.week;
  });

  return currentSeasonRewards.filter((reward) => reward.tokens);
}
