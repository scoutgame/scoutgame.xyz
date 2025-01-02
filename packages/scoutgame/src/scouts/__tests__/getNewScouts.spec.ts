import { jest } from '@jest/globals';
import { mockBuilder, mockScout, mockNFTPurchaseEvent } from '@packages/scoutgame/testing/database';

const mockSeason = '2023-W01';

// mock the getCurrentSeason function
jest.unstable_mockModule('../../dates/utils', () => ({
  getCurrentWeek: jest.fn(() => '2023-W02'),
  getCurrentSeason: jest.fn(() => ({ start: mockSeason }))
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
});
