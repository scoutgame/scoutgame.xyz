import { prisma } from '@charmverse/core/prisma-client';

async function removeWallet(address: string) {
  const wallet = await prisma.scoutWallet.findFirstOrThrow({
    where: {
      address: address.toLowerCase()
    },
    include: {
      purchaseEvents: true,
      scoutedNfts: true,
      tokensReceived: true,
      tokensSent: true
    }
  });
  console.log('user wallet', wallet);
  const scout = await prisma.scout.findFirstOrThrow({
    where: {
      id: wallet.scoutId
    },
    include: {
      wallets: true
    }
  });
  console.log('scout', scout);
  if (
    wallet.purchaseEvents.length > 0 ||
    wallet.scoutedNfts.length > 0 ||
    wallet.tokensReceived.length > 0 ||
    wallet.tokensSent.length > 0
  ) {
    console.error('WARNING! wallet has events, skipping');
    return;
  }
  if (scout.wallets.length === 1) {
    console.error('WARNING! scout has only one wallet, skipping');
    return;
  }
  console.log(
    'Deleted wallet',
    await prisma.scoutWallet.delete({
      where: {
        address: address.toLowerCase()
      }
    })
  );
  // try {
  //   const updatedScout = await prisma.scout.update({
  //     where: {
  //       id: scoutId
  //     },
  //     data: {
  //       scoutWallet: null
  //     }
  //   });

  //   console.log(`Successfully removed wallet for scout ${scoutId}`);
  //   return updatedScout;
  // } catch (error) {
  //   console.error(`Failed to remove wallet for scout ${scoutId}:`, error);
  //   throw error;
  // }
}

// Example usage:
removeWallet('0x1920e6d5aad018c75047de4e737919eeeeca7f67').catch(console.error);
