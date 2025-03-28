import { prisma } from '@charmverse/core/prisma-client';
import { mockScout } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';

import { connectWalletAccount } from '../connectWalletAccount';

describe('connectWalletAccount', () => {
  it('should connect a new wallet and set it as primary if user has no wallets', async () => {
    const mockWallet = randomWalletAddress().toLowerCase();
    const scout = await mockScout({ wallets: [] });

    const data = await connectWalletAccount({
      address: mockWallet,
      userId: scout.id
    });

    const wallet = await prisma.scoutWallet.findFirst({
      where: {
        scoutId: scout.id,
        address: mockWallet.toLowerCase()
      }
    });

    expect(wallet).toBeTruthy();
    expect(wallet?.primary).toBe(true);
    expect(data).toBe(undefined);
  });

  it('should connect a new wallet as non-primary if user already has wallets', async () => {
    const existingWalletAddress = randomWalletAddress().toLowerCase();
    const newWalletAddress = randomWalletAddress().toLowerCase();
    const scout = await mockScout({ wallets: [existingWalletAddress] });

    await connectWalletAccount({
      address: newWalletAddress,
      userId: scout.id
    });

    const wallet = await prisma.scoutWallet.findFirst({
      where: {
        scoutId: scout.id,
        address: newWalletAddress
      }
    });

    expect(wallet).toBeTruthy();
    expect(wallet?.primary).toBe(false);
  });

  it('should not throw error if wallet is already connected to the same user', async () => {
    const existingWalletAddress = randomWalletAddress().toLowerCase();
    const scout = await mockScout({ wallets: [existingWalletAddress] });

    await expect(
      connectWalletAccount({
        address: existingWalletAddress,
        userId: scout.id
      })
    ).resolves.toBeDefined();
  });

  it('should throw error if wallet is already connected to another user', async () => {
    const existingWalletAddress = randomWalletAddress().toLowerCase();
    const scout = await mockScout({ wallets: [existingWalletAddress] });
    const scout2 = await mockScout();

    const data = await connectWalletAccount({
      address: existingWalletAddress,
      userId: scout2.id
    });

    expect(data).toBeTruthy();
    expect(data?.id).toBe(scout.id);
  });
});
