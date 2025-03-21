import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import type { NextRequest } from 'next/server';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

type ScoutWithGithubUser = {
  id: string;
  path: string;
  createdAt: string;
  email?: string;
  tokenId?: number;
  optedInToMarketing?: string;
  builderStatus?: string;
  githubLogin?: string;
  fid?: number;
  farcasterName?: string;
  currentBalance: number;
  nftsPurchased: number;
  nftsSold: number;
  pointsEarnedAsScout: number;
  pointsEarnedAsBuilder: number;
  // weeklyBuilderRank?: number;
  developerLevel?: string;
  season: string;
};

export async function GET() {
  const users = await prisma.scout.findMany({
    where: {
      deletedAt: null
    },
    select: {
      id: true,
      path: true,
      sendMarketing: true,
      createdAt: true,
      avatar: true,
      email: true,
      builderStatus: true,
      farcasterId: true,
      farcasterName: true,
      currentBalance: true,
      githubUsers: true,
      userSeasonStats: true,
      userWeeklyStats: true,
      builderNfts: {
        where: {
          season: getCurrentSeasonStart()
        }
      }
    }
  });
  const rows: ScoutWithGithubUser[] = users.flatMap((user) => {
    // Create a map with shared user data
    const sharedUserData = {
      id: user.id,
      path: user.path!,
      createdAt: user.createdAt.toDateString(),
      email: user.email || undefined,
      optedInToMarketing: user.sendMarketing ? 'Yes' : '',
      builderStatus: user.builderStatus || undefined,
      tokenId: user.builderNfts[0]?.tokenId || undefined,
      fid: user.farcasterId || undefined,
      farcasterName: user.farcasterName || undefined,
      githubLogin: user.githubUsers[0]?.login,
      currentBalance: user.currentBalance
    };
    // If user has no season stats, create one row with default values
    if (user.userSeasonStats.length === 0) {
      return [
        // If user has no season stats, return one row with default values
        {
          ...sharedUserData,
          pointsEarnedAsScout: 0,
          pointsEarnedAsBuilder: 0,
          nftsPurchased: 0,
          nftsSold: 0,
          developerLevel: undefined,
          season: ''
        }
      ];
    }

    // Create one row per season stat
    return user.userSeasonStats.map((seasonStat) => ({
      ...sharedUserData,
      pointsEarnedAsScout: seasonStat.pointsEarnedAsScout,
      pointsEarnedAsBuilder: seasonStat.pointsEarnedAsBuilder,
      nftsPurchased: seasonStat.nftsPurchased,
      nftsSold: seasonStat.nftsSold,
      developerLevel: seasonStat.level || undefined,
      season: seasonStat.season
    }));
  });

  return respondWithTSV(rows, 'scout_users_export.tsv');
}
