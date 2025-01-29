import { prisma } from '@charmverse/core/prisma-client';
import { getAddress } from 'viem';

export async function deleteWallet({ address, userId }: { address: string; userId: string }) {
  const walletAddress = getAddress(address).toLowerCase();

  const scoutWallet = await prisma.scoutWallet.findFirst({
    where: { address: walletAddress, scoutId: userId },
    include: {
      scoutedNfts: true,
      purchaseEvents: true,
      saleEvents: true
    }
  });

  if (!scoutWallet) {
    throw new Error('Wallet not found');
  } else if (scoutWallet.primary) {
    throw new Error('Cannot delete primary wallet');
  } else if (scoutWallet.scoutedNfts.length > 0) {
    throw new Error('Cannot delete wallet with scouted NFTs');
  } else if (scoutWallet.purchaseEvents.length > 0) {
    throw new Error('Cannot delete wallet with purchase events');
  } else if (scoutWallet.saleEvents.length > 0) {
    throw new Error('Cannot delete wallet with sale events');
  }

  await prisma.scoutWallet.delete({
    where: { address: walletAddress, scoutId: userId, primary: false }
  });
}
