'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';

import { claimDailyReward } from './claimDailyReward';
import { claimDailyRewardSchema } from './claimDailyRewardSchema';

export const claimDailyRewardAction = authActionClient
  .schema(claimDailyRewardSchema)
  .action(async ({ parsedInput, ctx }) => {
    const data = await claimDailyReward({
      userId: ctx.session.scoutId,
      isBonus: parsedInput.isBonus,
      dayOfWeek: parsedInput.dayOfWeek,
      week: parsedInput.week
    });

    return { points: data.points };
  });
