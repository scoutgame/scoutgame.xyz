import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import {
  mockBuilder,
  mockScout,
  mockGemPayoutEvent,
  mockBuilderNft,
  mockNFTPurchaseEvent
} from '@packages/testing/database';

import { claimPoints } from '../claimPoints';

describe('claimPoints', () => {
  it('should claim points correctly', async () => {
    const builder = await mockBuilder({ currentBalance: 0 });
    const scout = await mockScout();
    await mockGemPayoutEvent({
      builderId: builder.id,
      recipientId: builder.id,
      amount: 10,
      season: getCurrentSeasonStart()
    });
    await mockBuilderNft({
      builderId: builder.id,
      season: getCurrentSeasonStart()
    });
    await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: scout.id,
      points: 20,
      season: getCurrentSeasonStart()
    });

    await claimPoints({ userId: builder.id, season: getCurrentSeasonStart() });

    const transactions = await prisma.pointsReceipt.findMany({
      where: {
        recipientId: builder.id
      }
    });

    expect(transactions).toHaveLength(2);
    expect(transactions[0].claimedAt).not.toBeNull();
    expect(transactions[1].claimedAt).not.toBeNull();

    const value = transactions.reduce((acc, curr) => acc + curr.value, 0);

    const updatedBuilder = await prisma.scout.findUniqueOrThrow({
      where: {
        id: builder.id
      }
    });
    expect(updatedBuilder.currentBalance).toBe(value);
  });
});
