'use server';

import { log } from '@charmverse/core/log';
import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { authSchema } from '@packages/farcaster/config';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { currentSeason } from '@packages/scoutgame/dates';

import { verifyFarcasterUser } from './verifyFarcasterUser';

export type FarcasterConnectedUser = {
  displayName: string;
  farcasterId: number;
  currentBalance: number;
  nftsPurchased: number;
  avatar: string;
  builderStatus: BuilderStatus | null;
};

export const connectFarcasterAccountAction = authActionClient
  .schema(authSchema)
  .action<{ connectedUser: FarcasterConnectedUser | null; success: boolean }>(async ({ ctx, parsedInput }) => {
    const { fid } = await verifyFarcasterUser(parsedInput);

    const existingFarcasterUser = await prisma.scout.findUnique({
      where: { farcasterId: fid },
      select: {
        displayName: true,
        farcasterId: true,
        currentBalance: true,
        userSeasonStats: {
          where: {
            season: currentSeason
          },
          select: {
            nftsPurchased: true
          }
        },
        builderStatus: true,
        builderNfts: {
          where: {
            season: currentSeason
          },
          select: {
            imageUrl: true
          }
        },
        avatar: true
      }
    });

    if (existingFarcasterUser) {
      return {
        success: true,
        connectedUser: {
          displayName: existingFarcasterUser.displayName,
          farcasterId: fid,
          currentBalance: existingFarcasterUser.currentBalance,
          nftsPurchased: existingFarcasterUser.userSeasonStats[0]?.nftsPurchased ?? 0,
          avatar: existingFarcasterUser.avatar as string,
          builderStatus: existingFarcasterUser.builderStatus
        }
      };
    }

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

    return { success: true, connectedUser: null };
  });
