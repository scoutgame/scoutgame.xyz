'use server';

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
  .action(async ({ ctx, parsedInput }) => {
    // Add the selection to the matchup
    await prisma.scoutMatchupSelection.delete({
      where: {
        matchupId_developerId: {
          matchupId: parsedInput.matchupId,
          developerId: parsedInput.developerId
        }
      }
    });

    // Revalidate the matchup page
    revalidatePath('/matchup', 'page');
  });
