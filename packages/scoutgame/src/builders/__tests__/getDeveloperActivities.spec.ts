import { mockBuilder, mockScout, mockPullRequestBuilderEvent } from '@packages/testing/database';

import { getDeveloperActivities } from '../getDeveloperActivities';

describe('getDeveloperActivities', () => {
  it('should return a merged pull request activity', async () => {
    const builder = await mockBuilder();
    await mockPullRequestBuilderEvent({ gemsValue: 10, builderId: builder.id });
    const result = await getDeveloperActivities({ builderId: builder.id, limit: 5 });

    expect(result).toHaveLength(1);
  });
});
