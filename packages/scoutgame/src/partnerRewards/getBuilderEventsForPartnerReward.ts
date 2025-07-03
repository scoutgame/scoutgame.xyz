import { prisma } from '@charmverse/core/prisma-client';

export async function getBuilderEventsForPartnerRewards({
  week,
  scoutPartnerId
}: {
  week: string;
  scoutPartnerId: string;
}) {
  const events = await prisma.githubEvent.findMany({
    where: {
      builderEvent: {
        scoutPartnerId,
        week
      },
      type: 'merged_pull_request',
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
      issues: {
        select: {
          issueNumber: true,
          tags: true
        }
      },
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
