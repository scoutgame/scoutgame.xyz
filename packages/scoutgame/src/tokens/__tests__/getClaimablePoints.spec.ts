import { getCurrentSeasonStart } from '@packages/dates/utils';
import { mockBuilder, mockGemPayoutEvent } from '@packages/testing/database';

// import { claimPoints } from '../claimPoints';
import { getClaimableTokens } from '../getClaimableTokens';

describe('getClaimableTokens', () => {
  it('should get claimable tokens correctly', async () => {
    const builder = await mockBuilder({ currentBalance: 0 });
    await mockGemPayoutEvent({
      builderId: builder.id,
      recipientId: builder.id,
      amount: 10,
      season: getCurrentSeasonStart()
    });
    const result = await getClaimableTokens({ userId: builder.id });
    expect(result.tokens).toEqual(10);
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
    const result = await getClaimableTokens({ userId: builder.id });
    expect(result.tokens).toEqual(0);
  });
});
