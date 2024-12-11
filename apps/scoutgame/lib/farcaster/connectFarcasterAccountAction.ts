'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { authSchema } from '@packages/farcaster/config';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { authActionClient } from '@packages/scoutgame/actions/actionClient';

import { verifyFarcasterUser } from './verifyFarcasterUser';

export const connectFarcasterAccountAction = authActionClient
  .schema(authSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { fid } = await verifyFarcasterUser(parsedInput);

    const profile = await getFarcasterUserById(fid).catch((error) => {
      log.error('Error fetching Farcaster profile', { fid, error });
      return null;
    });

    if (!profile) {
      throw new Error('Error fetching Farcaster profile');
    }

    const scoutId = ctx.session.scoutId;

    await prisma.scout.update({
      where: { id: scoutId },
      data: { farcasterId: fid, farcasterName: profile.username }
    });

    return { success: true };
  });
