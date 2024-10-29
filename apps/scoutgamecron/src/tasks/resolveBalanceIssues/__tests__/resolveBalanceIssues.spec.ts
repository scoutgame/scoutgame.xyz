import { prisma } from '@charmverse/core/prisma-client';
import { mockScout } from '@packages/scoutgame/testing/database';

import { resolveBalanceIssues } from '../resolveBalanceIssues';

describe('resolveBalanceIssues', () => {
  it('should resolve balance issues by creating an event to adjust the balance, and refresh the balance', async () => {
    const scout = await mockScout({
      currentBalance: 100
    });

    const initialReceiptsCount = await prisma.pointsReceipt.count({
      where: {
        recipientId: scout.id
      }
    });

    expect(initialReceiptsCount).toBe(0);

    await resolveBalanceIssues();

    const receipts = await prisma.pointsReceipt.findMany({
      where: {
        recipientId: scout.id
      }
    });

    expect(receipts.length).toBe(1);

    const receipt = receipts[0];

    expect(receipt.value).toBe(-100);
    expect(receipt.recipientId).toBe(scout.id);

    const updatedScout = await prisma.scout.findUniqueOrThrow({
      where: {
        id: scout.id
      }
    });

    expect(updatedScout.currentBalance).toBe(100);
  });
});
