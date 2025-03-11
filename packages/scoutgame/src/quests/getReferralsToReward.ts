import { prisma } from '@charmverse/core/prisma-client';
import { getWeekStartEndFromISOWeek } from '@packages/dates/utils';

type RewardRecipient = { path: string; userId: string; address: string; opAmount: number; referrals: number };

export const REFERRAL_REWARD_AMOUNT = 5;

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
    if (referee.wallets.length > 0) {
      if (!acc[referee.id]) {
        acc[referee.id] = {
          path: `https://scoutgame.xyz/u/${referee.path}`,
          userId: referee.id,
          address: referee.wallets[0].address,
          referrals: 0,
          opAmount: 0
        };
      }
      acc[referee.id].opAmount += REFERRAL_REWARD_AMOUNT;
    }
    if (referrer.wallets.length > 0) {
      if (!acc[referrer.id]) {
        acc[referrer.id] = {
          path: `https://scoutgame.xyz/u/${referrer.path}`,
          userId: referrer.id,
          address: referrer.wallets[0].address,
          referrals: 0,
          opAmount: 0
        };
      }
      acc[referrer.id].opAmount += REFERRAL_REWARD_AMOUNT;
      acc[referrer.id].referrals += 1;
    }
    return acc;
  }, {});

  return Object.values(referralCounts);
}
