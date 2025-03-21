import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { isOnchainPlatform } from '@packages/utils/platform';
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
  weeklyBuilderRank?: number;
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
      currentBalanceInScoutToken: true,
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
  const rows: ScoutWithGithubUser[] = users.map((user) => ({
    id: user.id,
    path: user.path!,
    createdAt: user.createdAt.toDateString(),
    email: user.email || undefined,
    optedInToMarketing: user.sendMarketing ? 'Yes' : '',
    // avatar: user.avatar || '',
    builderStatus: user.builderStatus || undefined,
    tokenId: user.builderNfts[0]?.tokenId || undefined,
    fid: user.farcasterId || undefined,
    farcasterName: user.farcasterName || undefined,
    githubLogin: user.githubUsers[0]?.login,
    currentBalance: isOnchainPlatform()
      ? Number(BigInt(user.currentBalanceInScoutToken ?? 0) / BigInt(10 ** 18))
      : user.currentBalance || 0,
    pointsEarnedAsScout: user.userSeasonStats[0]?.pointsEarnedAsScout || 0,
    pointsEarnedAsBuilder: user.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
    nftsPurchased: user.userSeasonStats[0]?.nftsPurchased || 0,
    nftsSold: user.userSeasonStats[0]?.nftsSold || 0,
    weeklyBuilderRank: user.userWeeklyStats[0]?.rank || undefined
  }));

  return respondWithTSV(rows, 'scout_users_export.tsv');
}
