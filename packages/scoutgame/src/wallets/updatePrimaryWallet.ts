import { prisma } from '@charmverse/core/prisma-client';
import { getAddress } from 'viem/utils';

export async function updatePrimaryWallet(_address: string, userId: string) {
  const address = getAddress(_address).toLowerCase();

  const userWallet = await prisma.scoutWallet.findUnique({
    where: { address, scoutId: userId }
  });

  if (!userWallet) {
    throw new Error('User wallet not found');
  }

  await prisma.$transaction([
    prisma.scoutWallet.updateMany({
      where: { scoutId: userId, primary: true },
      data: { primary: false }
    }),
    prisma.scoutWallet.update({
      where: { address, scoutId: userId },
      data: { primary: true }
    })
  ]);
}
