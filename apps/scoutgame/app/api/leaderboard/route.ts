import { prisma } from '@charmverse/core/prisma-client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return NextResponse.json({ error: 'No week provided' }, { status: 400 });
  }

  const userWeeklyStats = await prisma.userWeeklyStats.findMany({
    where: {
      week,
      rank: {
        not: null
      }
    },
    orderBy: {
      rank: 'asc'
    },
    select: {
      week: true,
      gemsCollected: true,
      rank: true,
      user: {
        select: {
          avatar: true,
          path: true,
          displayName: true
        }
      }
    }
  });

  return NextResponse.json({
    leaderboard: userWeeklyStats.map((stat) => ({
      gems: stat.gemsCollected,
      rank: stat.rank,
      developer: {
        avatar: stat.user.avatar,
        displayName: stat.user.displayName,
        path: stat.user.path,
        profileUrl: `https://scoutgame.xyz/u/${stat.user.path}`
      }
    }))
  });
}
