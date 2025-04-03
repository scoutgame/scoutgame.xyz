'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { MAX_SELECTIONS } from './config';

export const addMatchupSelectionAction = authActionClient
  .metadata({ actionName: 'update_partner_reward_payout' })
  .schema(
    yup.object({
      matchupId: yup.string().required(),
      developerId: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const selections = await prisma.scoutMatchupSelection.count({
      where: {
        matchupId: parsedInput.matchupId
      }
    });

    if (selections >= MAX_SELECTIONS) {
      throw new Error('You have reached the maximum number of selections');
    }

    // Add the selection to the matchup
    await prisma.scoutMatchupSelection.create({
      data: {
        matchup: {
          connect: {
            id: parsedInput.matchupId
          }
        },
        developer: {
          connect: {
            id: parsedInput.developerId
          }
        }
      }
    });

    // Revalidate the matchup page
    revalidatePath('/matchup', 'page');
  });
