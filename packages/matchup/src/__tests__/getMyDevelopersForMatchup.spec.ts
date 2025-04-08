import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { getCurrentWeek, getNextWeek } from '@packages/dates/utils';
import {
  mockBuilder,
  mockScout,
  mockPullRequestBuilderEvent,
  mockRepo,
  mockMatchup,
  mockBuilderEvent
} from '@packages/testing/database';

jest.unstable_mockModule('@packages/scoutgame/scouts/getScoutedBuilders', () => ({
  getScoutedBuilders: jest.fn()
}));

const { getScoutedBuilders } = await import('@packages/scoutgame/scouts/getScoutedBuilders');
const { getMyDevelopersForMatchup } = await import('../getMyDevelopersForMatchup');

describe('getMyDevelopersForMatchup', () => {
  const mockWeek = getCurrentWeek();

  it('should return empty array when no scouted developers', async () => {
    const scout = await mockScout();
    (getScoutedBuilders as jest.MockedFunction<typeof getScoutedBuilders>).mockResolvedValue([]);
    const result = await getMyDevelopersForMatchup({ scoutId: scout.id });
    expect(result).toEqual([]);
  });

  it('should combine the nft when the scout has both a starter and a regular nft', async () => {
    const scout = await mockScout();
    const builder = await mockBuilder({ createNft: true });
    const mockBuilderNft = {
      ...builder,
      nftType: 'starter_pack',
      price: BigInt(100),
      last14DaysRank: [1, 2],
      nftImageUrl: 'https://example.com/nft-image.png',
      congratsImageUrl: 'https://example.com/congrats-image.png',
      listings: [],
      showAdditionalStarterCard: true,
      starterCardImage: 'https://example.com/starter-card-image.png'
    };
    (getScoutedBuilders as jest.MockedFunction<typeof getScoutedBuilders>).mockResolvedValue([
      {
        ...mockBuilderNft,
        nftType: 'starter_pack'
      },
      {
        ...mockBuilderNft,
        nftType: 'default'
      }
    ]);
    const result = await getMyDevelopersForMatchup({ scoutId: scout.id });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        nftType: 'default',
        showAdditionalStarterCard: true
      })
    );
  });

  it('should combine the nft when the scout has both a starter and a regular nft', async () => {
    const scout = await mockScout();
    const builder = await mockBuilder({ createNft: true });
    const mockBuilderNft = {
      ...builder,
      nftType: 'starter_pack',
      price: BigInt(100),
      last14DaysRank: [1, 2],
      nftImageUrl: 'https://example.com/nft-image.png',
      congratsImageUrl: 'https://example.com/congrats-image.png',
      listings: [],
      showAdditionalStarterCard: true,
      starterCardImage: 'https://example.com/starter-card-image.png'
    };
    (getScoutedBuilders as jest.MockedFunction<typeof getScoutedBuilders>).mockResolvedValue([
      {
        ...mockBuilderNft,
        nftType: 'starter_pack'
      }
    ]);
    const result = await getMyDevelopersForMatchup({ scoutId: scout.id });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        nftType: 'starter_pack',
        showAdditionalStarterCard: false
      })
    );
  });
});
