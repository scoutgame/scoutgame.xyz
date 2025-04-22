import { prisma } from '@charmverse/core/prisma-client';
import { mockScout, mockPartnerRewardPayoutContract } from '@packages/testing/database';
import { v4 } from 'uuid';

import { updatePartnerRewardPayout } from '../updatePartnerRewardPayout';

describe('updatePartnerRewardPayout', () => {
  it('should throw an error if the payout is not found', async () => {
    await expect(
      updatePartnerRewardPayout({
        payoutContractId: v4(),
        txHash: '0x123',
        userId: v4()
      })
    ).rejects.toThrow();
  });

  it('should throw an error if the payout is already claimed', async () => {
    const scout = await mockScout();

    const payoutContract = await mockPartnerRewardPayoutContract({ scoutId: scout.id });

    await prisma.partnerRewardPayout.update({
      where: { id: payoutContract.rewardPayouts[0].id },
      data: { claimedAt: new Date() }
    });

    await expect(
      updatePartnerRewardPayout({
        payoutContractId: payoutContract.id,
        txHash: '0x123',
        userId: scout.id
      })
    ).rejects.toThrow('Partner reward payout already claimed');
  });

  it('should update a single partner reward payout a single contract', async () => {
    const scout = await mockScout();

    const payoutContract = await mockPartnerRewardPayoutContract({ scoutId: scout.id });

    await updatePartnerRewardPayout({
      payoutContractId: payoutContract.id,
      txHash: '0x123',
      userId: scout.id
    });

    const updatedPayout = await prisma.partnerRewardPayout.findFirstOrThrow({
      where: {
        id: payoutContract.rewardPayouts[0].id
      }
    });

    expect(updatedPayout.txHash).toBe('0x123');
    expect(updatedPayout.claimedAt).not.toBeNull();
  });

  it('should update multiple partner reward payouts for a single contract', async () => {
    const scout = await mockScout();

    const scoutWallet = await prisma.scoutWallet.findFirstOrThrow({ where: { scoutId: scout.id } });

    const payoutContract = await mockPartnerRewardPayoutContract({ scoutId: scout.id });

    const payout2 = await prisma.partnerRewardPayout.create({
      data: {
        amount: '100',
        walletAddress: scoutWallet.address,
        payoutContractId: payoutContract.id
      }
    });

    await updatePartnerRewardPayout({
      payoutContractId: payoutContract.id,
      txHash: '0x123',
      userId: scout.id
    });

    const updatedPayout1 = await prisma.partnerRewardPayout.findFirstOrThrow({
      where: { id: payoutContract.rewardPayouts[0].id }
    });

    const updatedPayout2 = await prisma.partnerRewardPayout.findFirstOrThrow({
      where: { id: payout2.id }
    });

    expect(updatedPayout1.txHash).toBe('0x123');
    expect(updatedPayout2.txHash).toBe('0x123');
    expect(updatedPayout1.claimedAt).not.toBeNull();
    expect(updatedPayout2.claimedAt).not.toBeNull();
  });
});
