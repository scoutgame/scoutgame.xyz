import { prisma } from '@charmverse/core/prisma-client';
import { getWeekStartEnd, getDateFromISOWeek } from '@packages/dates/utils';
import type { BonusPartner } from '@packages/scoutgame/partnerRewards/constants';

export async function getBuilderEventsForPartnerRewards({
  week,
  bonusPartner
}: {
  week: string;
  bonusPartner: BonusPartner;
}) {
  const { start, end } = getWeekStartEnd(getDateFromISOWeek(week).toJSDate());

  const events = await prisma.githubEvent.findMany({
    where: {
      builderEvent: {
        bonusPartner
      },
      type: 'merged_pull_request',
      completedAt: {
        gte: start.toJSDate(),
        lt: end.toJSDate()
      },
      githubUser: {
        builder: {
          deletedAt: null,
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
              displayName: true,
              wallets: {
                where: {
                  primary: true
                },
                select: {
                  address: true
                }
              }
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
  return events;
}
