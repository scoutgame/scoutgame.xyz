import { jest } from '@jest/globals';
import { mockBuilder, mockScout, mockBuilderNft, mockNFTPurchaseEvent } from '@packages/testing/database';

const mockSeason = '2023-W01';

// mock the getCurrentSeason function
jest.unstable_mockModule('@packages/dates/utils', () => ({
  getCurrentWeek: jest.fn(() => '2023-W02'),
  getCurrentSeason: jest.fn(() => ({ start: mockSeason })),
  getCurrentSeasonStart: jest.fn(() => mockSeason),
  getSeasonConfig: jest.fn(() => ({
    gemsPerRank: 10
  }))
}));

// Mock this so we don't get an error in the dependency tree
jest.unstable_mockModule('@packages/scoutgame/builders/getBuildersLeaderboardFromEAS', () => ({
  getBuildersLeaderboardFromEAS: jest.fn()
}));

const { getNewScouts } = await import('../getNewScouts');

describe('getNewScouts', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should retrieve a scout that signed up a long time ago', async () => {
    const mockWeek = '2023-W02'; // some unique week
    const builder = await mockBuilder({ createNft: true, nftSeason: mockSeason });
    const scout = await mockScout({ createdAt: new Date(2000, 1, 1) });

    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout.id, week: mockWeek, season: mockSeason });

    const scouts = await getNewScouts({ week: mockWeek });

    expect(scouts).toHaveLength(1);
  });

  it('should not retrieve a scout that purchased an NFT previously', async () => {
    const mockWeek = '2023-W04'; // some unique week
    const builder = await mockBuilder({ createNft: true, nftSeason: mockSeason });
    const scout = await mockScout({ createdAt: new Date(2000, 1, 1) });

    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout.id, week: '2023-W03', season: mockSeason });
    const scouts = await getNewScouts({ week: mockWeek });

    expect(scouts).toHaveLength(0);
  });

  it('should retrieve a scout even if they purchased another NFT later', async () => {
    const mockWeek = '2023-W04'; // some unique week
    const builder = await mockBuilder({ createNft: true, nftSeason: mockSeason });
    const scout = await mockScout({ createdAt: new Date(2000, 1, 1) });

    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout.id, week: mockWeek, season: mockSeason });
    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout.id, week: '2023-W06', season: mockSeason });

    const scouts = await getNewScouts({ week: mockWeek });

    expect(scouts).toHaveLength(1);
  });

  it('should retrieve a scout that purchased an NFT in a previous season', async () => {
    const lastSeasonWeek = '2023-W04';
    const mockWeek = '2023-W06'; // some unique week
    const builder = await mockBuilder({ createNft: true, nftSeason: '2023-W04' });
    await mockBuilderNft({ builderId: builder.id, season: '2023-W06' });
    const scout = await mockScout({ createdAt: new Date(2000, 1, 1) });

    await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: scout.id,
      week: lastSeasonWeek,
      season: lastSeasonWeek
    });
    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout.id, week: mockWeek, season: mockWeek });

    const scouts = await getNewScouts({ week: mockWeek, season: mockWeek });

    expect(scouts).toHaveLength(1);
  });
});
