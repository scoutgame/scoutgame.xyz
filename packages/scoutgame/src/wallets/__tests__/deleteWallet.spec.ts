import { prisma } from '@charmverse/core/prisma-client';
import { mockScout } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';

import { deleteWallet } from '../deleteWallet';

describe('deleteWallet', () => {
  it('should delete a non-primary wallet', async () => {
    const mockWallet1 = randomWalletAddress().toLowerCase();
    const mockWallet2 = randomWalletAddress().toLowerCase();
    const scout = await mockScout({ wallets: [mockWallet1, mockWallet2] });

    await deleteWallet({
      address: mockWallet2,
      userId: scout.id
    });

    // Verify wallet was deleted
    const deletedWallet = await prisma.scoutWallet.findUnique({
      where: { address: mockWallet2 }
    });
    expect(deletedWallet).toBeNull();
  });

  it('should throw error when trying to delete primary wallet', async () => {
    const mockWallet1 = randomWalletAddress().toLowerCase();
    const mockWallet2 = randomWalletAddress().toLowerCase();
    const scout = await mockScout({ wallets: [mockWallet1, mockWallet2] });

    await expect(
      deleteWallet({
        address: mockWallet1,
        userId: scout.id
      })
    ).rejects.toThrow('Cannot delete primary wallet');

    // Verify wallet still exists
    const wallet = await prisma.scoutWallet.findUnique({
      where: { address: mockWallet1 }
    });
    expect(wallet).toBeTruthy();
  });

  it('should throw error when wallet not found', async () => {
    const mockWallet1 = randomWalletAddress().toLowerCase();
    const scout = await mockScout();

    await expect(
      deleteWallet({
        address: mockWallet1,
        userId: scout.id
      })
    ).rejects.toThrow('Wallet not found');
  });
});
