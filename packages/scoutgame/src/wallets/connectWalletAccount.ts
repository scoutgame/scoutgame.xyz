import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserProfile } from '@packages/users/getUserProfile';

export async function connectWalletAccount({ address, userId }: { address: string; userId: string }) {
  const existingWalletUser = await getUserProfile({ walletAddress: address });

  if (existingWalletUser) {
    if (existingWalletUser.id === userId) {
      log.debug('Wallet already connected to user', {
        address,
        userId,
        existingWalletUser
      });
    }
    return existingWalletUser;
  }

  const wallets = await prisma.scoutWallet.findMany({ where: { scoutId: userId } });
  const primary = wallets.length === 0;

  await prisma.scoutWallet.create({
    data: {
      address: address.toLowerCase(),
      scoutId: userId,
      primary
    }
  });
}
