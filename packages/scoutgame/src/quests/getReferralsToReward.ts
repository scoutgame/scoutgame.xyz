import { prisma } from '@charmverse/core/prisma-client';
import { getWeekStartEndFromISOWeek } from '@packages/dates/utils';

type RewardRecipient = { userId: string; address: string; opAmount: number };

const REFERRAL_REWARD_AMOUNT = 5;

export async function getReferralsToReward(options: { week: string }): Promise<RewardRecipient[]> {
  const { start, end } = getWeekStartEndFromISOWeek(options.week);

  const referralEvents = await prisma.builderEvent.findMany({
    where: {
      createdAt: {
        gte: start.toJSDate(),
        lte: end.toJSDate()
      },
      type: {
        in: ['referral', 'referral_bonus']
      },
      builder: {
        deletedAt: null
      }
    },
    select: {
      createdAt: true,
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
  });

  // count how many referrals there are for each builder
  const referralCounts = referralEvents.reduce(
    (acc, event) => {
      acc[event.builder.id] = (acc[event.builder.id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return referralEvents.map((event) => ({
    userId: event.builder.id,
    address: event.builder.wallets[0].address,
    opAmount: REFERRAL_REWARD_AMOUNT * referralCounts[event.builder.id]
  }));
}
