import { prisma } from '@charmverse/core/prisma-client';
import { getWeekStartEnd, getDateFromISOWeek } from '@packages/dates/utils';
import type { BonusPartner } from '@packages/scoutgame/bonus';

export async function getBuildersForPartner({ week, bonusPartner }: { week: string; bonusPartner: BonusPartner }) {
  const { start, end } = getWeekStartEnd(getDateFromISOWeek(week).toJSDate());

  const events = await prisma.githubEvent.findMany({
    where: {
      repo: {
        bonusPartner
      },
      type: 'merged_pull_request',
      completedAt: {
        gte: start.toJSDate(),
        lt: end.toJSDate()
      },
      githubUser: {
        builder: {
          builderStatus: 'approved'
        }
      }
    },
    orderBy: {
      completedAt: 'asc'
    },
    select: {
      completedAt: true,
      githubUser: {
        select: {
          builder: {
            select: {
              path: true,
              email: true,
              displayName: true
            }
          }
        }
      },
      url: true,
      repo: {
        select: {
          name: true,
          owner: true
        }
      }
    }
  });
  return events.map((event) => ({
    'User Name': event.githubUser.builder!.displayName,
    'Profile Link': `https://scoutgame.xyz/u/${event.githubUser.builder!.path}`,
    Email: event.githubUser.builder!.email,
    Repo: `${event.repo.owner}/${event.repo.name}`,
    Date: event.completedAt?.toDateString(),
    Link: event.url
  }));
}
