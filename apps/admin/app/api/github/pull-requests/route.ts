import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getWeekFromDate } from '@packages/dates/utils';
import { getReposByOwner } from '@packages/github/getReposByOwner';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export type PullRequestResult = {
  url: string;
  builder: string;
  repo: string;
  week: string;
  date: string;
  title: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const partner = searchParams.get('partner');
  if (!partner || partner.length < 2) {
    log.warn('No partner provided to export pull requests');
    return NextResponse.json([]);
  }
  const events = await prisma.builderEvent.findMany({
    where: {
      scoutPartnerId: partner,
      type: 'merged_pull_request'
    },
    select: {
      createdAt: true,
      builder: {
        select: {
          displayName: true,
          path: true
        }
      },
      githubEvent: {
        select: {
          url: true,
          title: true,
          repo: {
            select: {
              owner: true,
              name: true
            }
          }
        }
      }
    }
  });
  const result: PullRequestResult[] = events
    .map((event) => ({
      builder: event.builder.displayName,
      builderProfile: `https://scoutgame.xyz/u/${event.builder.path}`,
      repo: `${event.githubEvent!.repo.owner}/${event.githubEvent!.repo.name}`,
      url: event.githubEvent!.url,
      title: event.githubEvent!.title,
      week: getWeekFromDate(event.createdAt),
      date: event.createdAt.toISOString()
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return respondWithTSV(result, `${partner} pull requests.tsv`);
}
