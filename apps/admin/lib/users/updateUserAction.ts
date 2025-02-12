'use server';

import type { BuilderStatus } from '@charmverse/core/prisma';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { attestBuilderStatusEvent } from '@packages/scoutgameattestations/attestBuilderStatusEvent';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';

import { setBuilderStatus } from './updateUser';

export const setBuilderStatusAction = authActionClient
  .metadata({ actionName: 'set_builder_status' })
  .schema(
    yup.object({
      userId: yup.string().required(),
      status: yup.string().required(),
      isUnbanned: yup.boolean().optional()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const { userId, status, isUnbanned } = parsedInput;
    const result = await setBuilderStatus(userId, status as BuilderStatus);

    if (status === 'approved' && isUnbanned) {
      await attestBuilderStatusEvent({
        builderId: userId,
        event: {
          type: 'unbanned',
          description: 'Builder unbanned',
          season: getCurrentSeasonStart()
        }
      });
    }

    return result;
  });
