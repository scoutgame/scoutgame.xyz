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
      week: yup.string().required(),
      developerId: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const selections = await prisma.scoutMatchupSelection.count({
      where: {
        matchup: {
          createdBy: ctx.session.scoutId,
          week: parsedInput.week
        }
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
            createdBy_week: {
              createdBy: ctx.session.scoutId,
              week: parsedInput.week
            }
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
