import { mockBuilder, mockScout, mockBuilderNft } from '@packages/testing/database';

import { getDeveloperActivities } from '../getDeveloperActivities';

describe('getDeveloperActivities', () => {
  it('should return developer activities from different seasons', async () => {
    const builder = await mockBuilder();
    const scout = await mockScout();
    await mockBuilderNft({
      builderId: builder.id,
      owners: [scout],
      season: '2023-06'
    });
    await mockBuilderNft({
      builderId: builder.id,
      owners: [scout],
      season: '2023-01'
    });
    const result = await getDeveloperActivities({ builderId: builder.id, limit: 5 });

    expect(result).toHaveLength(2);
  });
});
