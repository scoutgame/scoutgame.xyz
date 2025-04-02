'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { MAX_SELECTIONS, MAX_CREDITS } from './config';

export const addMatchupSelectionAction = authActionClient
  .metadata({ actionName: 'update_partner_reward_payout' })
  .schema(
    yup.object({
      week: yup.string().required(),
      developerId: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const selections = await prisma.scoutMatchupSelection.findMany({
      where: {
        matchup: {
          createdBy: ctx.session.scoutId,
          week: parsedInput.week
        }
      },
      select: {
        developer: {
          select: {
            userSeasonStats: {
              where: {
                season: getCurrentSeasonStart()
              },
              select: {
                level: true
              }
            }
          }
        }
      }
    });

    if (selections.length !== MAX_SELECTIONS) {
      throw new Error('You have not selected the correct number of developers');
    }

    const totalCredits = selections.reduce(
      (acc, selection) => acc + (selection.developer.userSeasonStats[0].level || 0),
      0
    );

    if (totalCredits > MAX_CREDITS) {
      throw new Error('You have exceeded the maximum number of credits');
    }

    // Add the selection to the matchup
    await prisma.scoutMatchup.update({
      where: {
        createdBy_week: {
          createdBy: ctx.session.scoutId,
          week: parsedInput.week
        }
      },
      data: {
        submittedAt: new Date()
      }
    });

    // Revalidate the matchup page
    revalidatePath('/matchup', 'page');
  });
