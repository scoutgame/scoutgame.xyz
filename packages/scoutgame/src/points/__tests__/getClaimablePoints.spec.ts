import { getCurrentSeasonStart } from '@packages/dates/utils';
import { mockBuilder, mockGemPayoutEvent } from '@packages/testing/database';

// import { claimPoints } from '../claimPoints';
import { getClaimablePoints } from '../getClaimablePoints';

describe('getClaimablePoints', () => {
  it('should get claimable points correctly', async () => {
    const builder = await mockBuilder({ currentBalance: 0 });
    await mockGemPayoutEvent({
      builderId: builder.id,
      recipientId: builder.id,
      amount: 10,
      season: getCurrentSeasonStart()
    });
    const result = await getClaimablePoints({ userId: builder.id });
    expect(result.points).toEqual(10);
  });

  xit('should skip points already claimed', async () => {
    const builder = await mockBuilder({ currentBalance: 0 });
    await mockGemPayoutEvent({
      builderId: builder.id,
      recipientId: builder.id,
      amount: 10,
      season: getCurrentSeasonStart()
    });
    // await claimPoints({ userId: builder.id });
    const result = await getClaimablePoints({ userId: builder.id });
    expect(result.points).toEqual(0);
  });
});
