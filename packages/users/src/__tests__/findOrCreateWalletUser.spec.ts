import { prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { randomWalletAddress } from '@packages/testing/generators';
import { getAddress } from 'viem';

import { findOrCreateWalletUser } from '../findOrCreateWalletUser';

describe('findOrCreateWalletUser', () => {
  it('should create a user for a valid wallet address', async () => {
    const wallet = randomWalletAddress();
    const user = await findOrCreateWalletUser({ wallet });

    const scoutWallet = await prisma.scoutWallet.findFirstOrThrow({
      where: {
        address: wallet
      }
    });

    expect(scoutWallet).toBeDefined();
    expect(scoutWallet.scoutId).toBe(user.id);
    expect(scoutWallet.address).toBe(wallet);
    expect(scoutWallet.primary).toBe(true);
  });

  it('should return an existing user if the wallet address already exists, and be case-insensitive', async () => {
    const wallet = randomWalletAddress();

    const result = await findOrCreateWalletUser({ wallet: wallet.toLowerCase() });

    const secondResult = await findOrCreateWalletUser({ wallet: getAddress(wallet) });

    expect(secondResult.id).toBe(result.id);
  });

  it('should throw an error if the wallet address is the null EVM address', () => {
    expect(findOrCreateWalletUser({ wallet: NULL_EVM_ADDRESS })).rejects.toThrow(
      'Cannot create a user for the null wallet address 0x00...00'
    );
  });
});
