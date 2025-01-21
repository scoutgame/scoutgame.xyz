'use server';

import { log } from '@charmverse/core/log';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { completeQuests } from './completeQuests';
import { questsRecord } from './questRecords';
import type { QuestType } from './questRecords';

export const completeQuestAction = authActionClient
  .schema(
    yup.object({
      questType: yup.string<QuestType>().required()
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const quest = questsRecord[parsedInput.questType];
    if (!quest) {
      throw new Error('Quest not found');
    }
    if (!quest.verifiable) {
      await completeQuests(ctx.session.scoutId, [parsedInput.questType]);
      revalidatePath('/quests');
    } else {
      log.error(`Quest type is verifiable: ${parsedInput.questType}`, {
        parsedInput,
        userId: ctx.session.scoutId
      });
    }
  });
