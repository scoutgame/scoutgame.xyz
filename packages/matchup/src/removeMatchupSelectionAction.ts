'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

export const removeMatchupSelectionAction = authActionClient
  .metadata({ actionName: 'update_partner_reward_payout' })
  .schema(
    yup.object({
      matchupId: yup.string().required(),
      developerId: yup.string().required()
    })
  )
  .action(async ({ parsedInput }) => {
    // Add the selection to the matchup
    try {
      await prisma.scoutMatchupSelection.delete({
        where: {
          matchupId_developerId: {
            matchupId: parsedInput.matchupId,
            developerId: parsedInput.developerId
          }
        }
      });
    } catch (error) {
      // most likely already deleted
      log.warn('matchup selection already deleted', { error, ...parsedInput });
    }

    // Revalidate the matchup page
    revalidatePath('/matchup', 'page');
  });
