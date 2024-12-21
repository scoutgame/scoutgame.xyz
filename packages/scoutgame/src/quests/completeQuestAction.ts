'use server';

import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { authActionClient } from '../actions/actionClient';

import { completeQuests } from './completeQuests';
import type { QuestType } from './questRecords';

export const completeQuestAction = authActionClient
  .schema(
    yup.object({
      questType: yup.string<QuestType>().required()
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    await completeQuests(ctx.session.scoutId, [parsedInput.questType]);
    revalidatePath('/quests');
  });
