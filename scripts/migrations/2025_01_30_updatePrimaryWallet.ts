import { prisma } from '@charmverse/core/prisma-client';

export async function markPrimaryWallet() {
  const scouts = await prisma.scout.findMany({
    where: {
      wallets: {
        some: {
          address: {
            startsWith: '0x'
          }
        }
      }
    },
    include: {
      wallets: {
        include: {
          purchaseEvents: true
        }
      }
    }
  });

  for (const scout of scouts) {
    const firstWallet = scout.wallets.at(0);

    if (!firstWallet) {
      continue;
    }

    const primaryWallet = scout.wallets.find((wallet) => wallet.purchaseEvents.length > 0);

    await prisma.scoutWallet.update({
      where: {
        scoutId: scout.id,
        address: primaryWallet?.address || scout.wallets.at(0)?.address
      },
      data: { primary: true }
    });
  }
}

markPrimaryWallet();
