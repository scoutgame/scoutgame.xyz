import { prisma } from '@charmverse/core/prisma-client';

export const mergeUserAccount = async ({
  userId,
  farcasterId,
  telegramId
}: {
  userId: string;
  farcasterId?: number;
  telegramId?: number;
}) => {
  if (!farcasterId && !telegramId) {
    throw new Error('No farcaster or telegram id provided');
  }

  const mergedUser = await prisma.scout.findFirstOrThrow({
    where: {
      OR: [{ farcasterId }, { telegramId }]
    },
    select: {
      id: true,
      currentBalance: true,
      farcasterName: true,
      walletENS: true,
      wallets: true
    }
  });

  const existingUser = await prisma.scout.findUniqueOrThrow({
    where: { id: userId },
    select: {
      walletENS: true
    }
  });

  await prisma.$transaction(async (tx) => {
    await tx.scout.update({
      where: { id: userId },
      data: {
        farcasterId,
        farcasterName: farcasterId ? mergedUser.farcasterName : undefined,
        telegramId,
        currentBalance: {
          increment: mergedUser.currentBalance
        },
        walletENS: existingUser.walletENS ? existingUser.walletENS : mergedUser.walletENS
      }
    });

    await prisma.scoutWallet.updateMany({
      where: {
        scoutId: mergedUser.id
      },
      data: {
        scoutId: userId
      }
    });

    await tx.scout.update({
      where: { id: mergedUser.id },
      data: {
        deletedAt: new Date()
      }
    });
  });
};
