import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const wallet = searchParams.get('wallet');
  const farcasterId = searchParams.get('farcasterId');
  const farcasterName = searchParams.get('farcasterName');

  if (!path && !wallet && !farcasterId && !farcasterName) {
    return NextResponse.json({ error: 'No path, wallet, farcasterId, or farcasterName provided' }, { status: 400 });
  }

  const where: Prisma.ScoutWhereInput = {
    builderStatus: 'approved'
  };

  if (path) {
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

  const developer = await prisma.scout.findFirst({
    where,
    select: {
      avatar: true,
      displayName: true,
      path: true,
      userSeasonStats: {
        where: {
          season: getCurrentSeasonStart()
        },
        select: {
          level: true
        }
      },
      userWeeklyStats: {
        where: {
          season: getCurrentSeasonStart()
        },
        orderBy: {
          week: 'asc'
        },
        select: {
          week: true,
          gemsCollected: true
        }
      }
    }
  });

  if (!developer) {
    return NextResponse.json({ developer: null }, { status: 200 });
  }

  return NextResponse.json({
    developer: {
      avatar: developer.avatar,
      displayName: developer.displayName,
      profileUrl: `https://scoutgame.xyz/u/${developer.path}`,
      level: developer.userSeasonStats[0].level,
      gemsEarned: developer.userWeeklyStats.map((weeklyStat) => ({
        week: weeklyStat.week,
        count: weeklyStat.gemsCollected
      }))
    }
  });
}
