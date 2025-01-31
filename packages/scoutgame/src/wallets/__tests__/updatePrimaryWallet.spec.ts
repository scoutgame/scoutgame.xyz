import { prisma } from '@charmverse/core/prisma-client';
import { mockScout } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';

import { updatePrimaryWallet } from '../updatePrimaryWallet';

describe('updatePrimaryWallet', () => {
  it('should update the primary wallet for a user', async () => {
    const wallet1 = randomWalletAddress().toLowerCase();
    const wallet2 = randomWalletAddress().toLowerCase();
    const scout = await mockScout({ wallets: [wallet1, wallet2] });

    // Check that wallet1 to be primary
    const wallet1Status = await prisma.scoutWallet.findUnique({
      where: { address: wallet1 }
    });
    expect(wallet1Status?.primary).toBe(true);

    // Update primary wallet to wallet2
    await updatePrimaryWallet(wallet2, scout.id);

    // Check that wallet2 is now primary and wallet 1 is no longer primary
    const updatedWallet2 = await prisma.scoutWallet.findUnique({
      where: { address: wallet2 }
    });
    const updatedWallet1 = await prisma.scoutWallet.findUnique({
      where: { address: wallet1 }
    });
    expect(updatedWallet2?.primary).toBe(true);
    expect(updatedWallet1?.primary).toBe(false);
  });

  it('should throw error if wallet does not exist', async () => {
    const nonExistentAddress = randomWalletAddress().toLowerCase();

    const scout = await mockScout();

    await expect(updatePrimaryWallet(nonExistentAddress, scout.id)).rejects.toThrow('User wallet not found');
  });

  it('should throw an error if wallet exists but is not connected to the user', async () => {
    const wallet1 = randomWalletAddress().toLowerCase();
    const wallet2 = randomWalletAddress().toLowerCase();
    const scout1 = await mockScout({ wallets: [wallet1] });
    const scout2 = await mockScout({ wallets: [wallet2] });

    // Update primary wallet for scout1
    await expect(updatePrimaryWallet(wallet1, scout2.id)).rejects.toThrow('User wallet not found');
  });
});
