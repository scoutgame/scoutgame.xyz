'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse } from '@farcaster/auth-kit';
import { prettyPrint } from '@root/lib/utils/strings';
import * as yup from 'yup';

import { actionClient } from '../actionClient';

export const loginWithFarcasterAction = actionClient
  .metadata({ actionName: 'login' })
  .schema(yup.object({ loginPayload: yup.object<StatusAPIResponse>({}) })) // accept all body input
  .action(async ({ ctx, parsedInput }) => {
    const { fid, username } = parsedInput.loginPayload as StatusAPIResponse;

    log.info('User logged in to waitlist', { fid, username });

    const currentWaitlistSlot = await prisma.connectWaitlistSlot.findUnique({
      where: {
        fid
      }
    });

    const hasJoinedWaitlist = !!currentWaitlistSlot;

    ctx.session.farcasterUser = { fid: fid?.toString() as string, username, hasJoinedWaitlist };
    await ctx.session.save();

    return { success: true, fid, hasJoinedWaitlist };
  });
