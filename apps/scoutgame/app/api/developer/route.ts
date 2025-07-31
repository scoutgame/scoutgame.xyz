import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const path = searchParams.get('path');
  const wallet = searchParams.get('wallet');
  const farcasterId = searchParams.get('farcasterId');
  const farcasterName = searchParams.get('farcasterName');

  if (!path && !wallet && !farcasterId && !farcasterName && !id) {
    return NextResponse.json({ error: 'No path, wallet, farcasterId, farcasterName, or id provided' }, { status: 400 });
  }

  const where: Prisma.ScoutWhereInput = {
    builderStatus: {
      in: ['banned', 'approved']
    }
  };

  if (id) {
    where.id = id;
  } else if (path) {
    where.path = path;
  } else if (wallet) {
    where.wallets = {
      some: {
        address: wallet.toLowerCase()
      }
    };
  } else if (farcasterId) {
    where.farcasterId = parseInt(farcasterId);
  } else if (farcasterName) {
    where.farcasterName = farcasterName;
  }

  const currentSeason = getCurrentSeasonStart();

  const developer = await prisma.scout.findFirst({
    where,
    select: {
      id: true,
      avatar: true,
      displayName: true,
      path: true,
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          tokenId: true
        }
      },
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          level: true
        }
      },
      userWeeklyStats: {
        where: {
          season: currentSeason
        },
        orderBy: {
          week: 'asc'
        },
        select: {
          rank: true,
          week: true,
          gemsCollected: true
        }
      }
    }
  });

  if (!developer) {
    return NextResponse.json({ developer: null }, { status: 404 });
  }

  return NextResponse.json({
    developer: {
      id: developer.id,
      avatar: developer.avatar,
      displayName: developer.displayName,
      path: developer.path,
      profileUrl: `https://scoutgame.xyz/u/${developer.path}`,
      level: developer.userSeasonStats[0]?.level,
      tokenId: developer.builderNfts[0]?.tokenId,
      weeklyStats: (developer.userWeeklyStats ?? []).map((weeklyStat) => ({
        week: weeklyStat.week,
        count: weeklyStat.gemsCollected,
        rank: weeklyStat.rank
      }))
    }
  });
}
