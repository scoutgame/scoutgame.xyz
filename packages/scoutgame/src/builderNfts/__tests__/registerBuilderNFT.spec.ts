import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { mockBuilder, mockBuilderNft } from '@packages/testing/database';
import { randomLargeInt } from '@packages/testing/generators';

// Mock the constants module first
jest.unstable_mockModule('../constants', () => ({
  builderNftChain: { id: 10 },
  getBuilderNftContractAddress: () => '0x1234567890123456789012345678901234567890',
  scoutProtocolBuilderNftContractAddress: '0x1234567890123456789012345678901234567890'
}));

// Import constants after mocking
const { builderNftChain, getBuilderNftContractAddress } = await import('../constants');

jest.unstable_mockModule('../clients/builderNftContractReadonlyClient', () => ({
  getBuilderNftContractMinterClient: () => ({
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt())
  }),
  getBuilderNftContractReadonlyClient: () => ({
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt())
  })
}));

jest.unstable_mockModule('../builderRegistration/createBuilderNft', () => ({
  createBuilderNft: jest.fn()
}));

const { getBuilderNftContractMinterClient } = await import('../clients/builderNftContractReadonlyClient');

const { registerBuilderNFT } = await import('../builderRegistration/registerBuilderNFT');

const { createBuilderNft } = await import('../builderRegistration/createBuilderNft');

describe('registerBuilderNFT', () => {
  const mockSeason = getCurrentSeasonStart();
  const mockContractAddress = getBuilderNftContractAddress(mockSeason);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new builder NFT record in the database', async () => {
    const builder = await mockBuilder();
    (createBuilderNft as jest.Mock<typeof createBuilderNft>).mockImplementation(async () => {
      return mockBuilderNft({
        builderId: builder.id,
        season: mockSeason,
        chainId: builderNftChain.id,
        contractAddress: mockContractAddress
      });
    });

    // Call the function
    await registerBuilderNFT({
      builderId: builder.id,
      season: mockSeason,
      contractAddress: mockContractAddress
    });

    // Verify that a new NFT record was created in the database
    const createdNft = await prisma.builderNft.findFirst({
      where: {
        builderId: builder.id,
        chainId: builderNftChain.id,
        contractAddress: mockContractAddress,
        season: mockSeason
      }
    });

    expect(createdNft).not.toBeNull();
    expect(createdNft?.builderId).toBe(builder.id);
    expect(createdNft?.season).toBe(mockSeason);
    expect(createdNft?.chainId).toBe(builderNftChain.id);
    expect(createdNft?.contractAddress).toBe(mockContractAddress);
  });

  it('should return existing builder NFT if already registered', async () => {
    const builder = await mockBuilder();
    const existingNft = await mockBuilderNft({
      builderId: builder.id,
      season: mockSeason,
      chainId: builderNftChain.id,
      contractAddress: getBuilderNftContractAddress(mockSeason)
    });

    const result = await registerBuilderNFT({
      builderId: builder.id,
      season: mockSeason,
      contractAddress: getBuilderNftContractAddress(mockSeason)
    });

    expect(result?.id).toEqual(existingNft.id);
    expect(getBuilderNftContractMinterClient().registerBuilderToken).not.toHaveBeenCalled();
  });
});
