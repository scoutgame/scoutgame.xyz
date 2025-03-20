import { prisma } from '@charmverse/core/prisma-client';
import { checkSanctionedAddress } from '@packages/blockchain/webcacy/checkSanctionedAddress';

const BLACKLISTED_TIME_FRAME = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function checkWalletSanctionStatus(address: string) {
  const walletSanctionStatus = await prisma.walletSanctionStatus.findUnique({
    where: {
      address: address.toLowerCase()
    }
  });

  if (walletSanctionStatus && walletSanctionStatus.isSanctioned) {
    return true;
  }

  const checkBlacklistedStatus =
    !walletSanctionStatus ||
    !walletSanctionStatus.checkedAt ||
    walletSanctionStatus.checkedAt < new Date(Date.now() - BLACKLISTED_TIME_FRAME);

  if (checkBlacklistedStatus) {
    const isSanctioned = await checkSanctionedAddress(address);
    await prisma.walletSanctionStatus.upsert({
      where: {
        address: address.toLowerCase()
      },
      update: {
        isSanctioned,
        checkedAt: new Date()
      },
      create: {
        address: address.toLowerCase(),
        isSanctioned,
        checkedAt: new Date()
      }
    });

    return isSanctioned;
  }

  return false;
}
