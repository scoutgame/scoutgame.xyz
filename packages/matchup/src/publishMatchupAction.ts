'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { MAX_SELECTIONS, MAX_CREDITS } from './config';

export const publishMatchupAction = authActionClient
  .metadata({ actionName: 'update_partner_reward_payout' })
  .schema(
    yup.object({
      matchupId: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const selections = await prisma.scoutMatchupSelection.findMany({
      where: {
        matchupId: parsedInput.matchupId
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
        id: parsedInput.matchupId
      },
      data: {
        submittedAt: new Date()
      }
    });

    log.info('User published matchup', {
      userId: ctx.session.scoutId,
      matchupId: parsedInput.matchupId
    });

    // Revalidate the matchup page
    revalidatePath('/matchup', 'page');
  });
