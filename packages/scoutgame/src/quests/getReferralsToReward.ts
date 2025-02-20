import { prisma } from '@charmverse/core/prisma-client';
import { getWeekStartEndFromISOWeek } from '@packages/dates/utils';

type RewardRecipient = { userId: string; address: string; opAmount: number };

const REFERRAL_REWARD_AMOUNT = 5;

export async function getReferralsToReward(options: { week: string }): Promise<RewardRecipient[]> {
  const { start, end } = getWeekStartEndFromISOWeek(options.week);

  const referralEvents = await prisma.referralCodeEvent.findMany({
    where: {
      completedAt: {
        gte: start.toJSDate(),
        lte: end.toJSDate()
      },
      referee: {
        deletedAt: null
      },
      builderEvent: {
        builder: {
          deletedAt: null
        }
      }
    },
    select: {
      createdAt: true,
      referee: {
        select: {
          id: true,
          avatar: true,
          displayName: true,
          path: true,
          wallets: {
            where: {
              primary: true
            },
            select: {
              address: true
            }
          }
        }
      },
      builderEvent: {
        select: {
          builder: {
            select: {
              id: true,
              avatar: true,
              displayName: true,
              path: true,
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
      }
    }
  });

  // count how many referrals there are for each builder
  const referralCounts = referralEvents.reduce<Record<string, RewardRecipient>>((acc, event) => {
    const referee = event.referee;
    const referrer = event.builderEvent.builder;
    if (!acc[referee.id]) {
      acc[referee.id] = {
        userId: referee.id,
        address: referee.wallets[0].address,
        opAmount: 0
      };
    }
    if (!acc[referrer.id]) {
      acc[referrer.id] = {
        userId: referrer.id,
        address: referrer.wallets[0].address,
        opAmount: 0
      };
    }
    acc[referee.id].opAmount += REFERRAL_REWARD_AMOUNT;
    acc[referrer.id].opAmount += REFERRAL_REWARD_AMOUNT;
    return acc;
  }, {});

  return Object.values(referralCounts);
}
