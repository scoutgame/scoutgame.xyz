'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';

import { claimDailyReward } from './claimDailyReward';
import { claimDailyRewardSchema } from './claimDailyRewardSchema';

export const claimDailyRewardAction = authActionClient
  .schema(claimDailyRewardSchema)
  .action(async ({ parsedInput, ctx }) => {
    const data = await claimDailyReward({
      userId: ctx.session.scoutId,
      isBonus: parsedInput.isBonus,
      dayOfWeek: parsedInput.dayOfWeek
    });

    revalidatePath('/quests');

    return { points: data.points };
  });
