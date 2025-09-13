import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/utils/types';
import { DateTime } from 'luxon';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const path = searchParams.get('path');

  if (!path && !id) {
    return NextResponse.json({ error: 'No path or id provided' }, { status: 400 });
  }

  const oneWeekAgoDate = DateTime.now().minus({ week: 1 }).toJSDate();

  const previousGitEvents = await prisma.githubEvent.findMany({
    where: {
      builderEvent: {
        builder: id
          ? {
              id
            }
          : {
              path: path!
            }
      },
      // streaks are based on merged date
      completedAt: {
        gte: oneWeekAgoDate
      },
      type: 'merged_pull_request'
    },
    select: {
      id: true,
      completedAt: true,
      url: true,
      builderEvent: {
        select: {
          gemsReceipt: {
            select: {
              type: true,
              value: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const streakEvent = previousGitEvents
    .filter((e) => e.builderEvent?.gemsReceipt && e.builderEvent?.gemsReceipt?.type === 'third_pr_in_streak')
    .map((e) => e.completedAt)
    .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0));
  const lastStreakEventDate = streakEvent?.[0]?.toISOString().split('T')[0];
  const currentStreakDays = Array.from(
    new Set(
      previousGitEvents
        .filter((e) => e.builderEvent)
        .map((e) => e.completedAt && e.completedAt.toISOString().split('T')[0])
        .filter(isTruthy)
        .filter((dateStr) => !lastStreakEventDate || dateStr > lastStreakEventDate)
    )
  );

  const todayDate = DateTime.now().toISO().split('T')[0];
  const isFirstPrToday = !currentStreakDays.includes(todayDate);
  const streakWithNextPullRequest = isFirstPrToday && currentStreakDays.length % 3 === 2;

  return NextResponse.json({
    lastStreakEventDate,
    streakWithNextPullRequest,
    currentStreakDays,
    streakEndDate: currentStreakDays.length
      ? DateTime.fromISO(currentStreakDays[0]).plus({ week: 1 }).toISO().split('T')[0]
      : null,
    weeklyMergedPullRequests: previousGitEvents
      .map((previousGitEvent) => ({
        id: previousGitEvent.id,
        url: previousGitEvent.url,
        gemsCollected: previousGitEvent.builderEvent?.gemsReceipt?.value ?? 0,
        mergedAt: previousGitEvent.completedAt
      }))
      .sort((a, b) => (a.mergedAt! > b.mergedAt! ? -1 : 1))
  });
}
