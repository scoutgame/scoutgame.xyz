import { prisma } from '@charmverse/core/prisma-client';
import { checkSanctionedAddress } from '@packages/blockchain/webcacy/checkSanctionedAddress';

const BLACKLISTED_TIME_FRAME = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function checkWalletSanctionStatus(address: string) {
  const scoutWallet = await prisma.scoutWallet.findUniqueOrThrow({
    where: {
      address: address.toLowerCase()
    }
  });

  if (scoutWallet.isSanctioned) {
    return true;
  }

  const checkBlacklistedStatus =
    !scoutWallet.lastSanctionCheckedAt ||
    scoutWallet.lastSanctionCheckedAt < new Date(Date.now() - BLACKLISTED_TIME_FRAME);

  if (checkBlacklistedStatus) {
    const isSanctioned = await checkSanctionedAddress(address);
    await prisma.scoutWallet.update({
      where: {
        address: address.toLowerCase()
      },
      data: {
        isSanctioned,
        lastSanctionCheckedAt: new Date()
      }
    });

    return isSanctioned;
  }

  return false;
}
