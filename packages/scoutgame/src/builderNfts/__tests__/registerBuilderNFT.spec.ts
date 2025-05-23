import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder, mockBuilderNft } from '@packages/testing/database';
import { randomLargeInt } from '@packages/testing/generators';

import { devTokenDecimals } from '../../protocol/constants';

// Mock the constants module first
jest.unstable_mockModule('../constants', () => ({
  nftChain: { id: 10 },
  getNFTContractAddress: () => '0x1234567890123456789012345678901234567890',
  getStarterNFTContractAddress: () => '0x1234567890123456789012345678901234567890',
  scoutProtocolBuilderNftContractAddress: '0x1234567890123456789012345678901234567890'
}));

// Import constants after mocking
const { nftChain, getNFTContractAddress } = await import('../constants');

jest.unstable_mockModule('../../protocol/clients/getNFTClient', () => ({
  getNFTMinterClient: () => ({
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt(devTokenDecimals))
  }),
  getNFTReadonlyClient: () => ({
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt(devTokenDecimals))
  })
}));

jest.unstable_mockModule('../registration/createBuilderNft', () => ({
  createBuilderNft: jest.fn()
}));

const { getNFTMinterClient } = await import('../../protocol/clients/getNFTClient');

const { registerDeveloperNFT } = await import('../registration/registerDeveloperNFT');

const { createBuilderNft } = await import('../registration/createBuilderNft');

describe('registerDeveloperNFT', () => {
  const mockSeason = '2025-W02';
  const mockContractAddress = getNFTContractAddress(mockSeason);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new builder NFT record in the database', async () => {
    const builder = await mockBuilder();
    (createBuilderNft as jest.Mock<typeof createBuilderNft>).mockImplementation(async () => {
      return mockBuilderNft({
        builderId: builder.id,
        season: mockSeason,
        chainId: nftChain.id,
        contractAddress: mockContractAddress
      });
    });

    // Call the function
    await registerDeveloperNFT({
      builderId: builder.id,
      season: mockSeason,
      contractAddress: mockContractAddress
    });

    // Verify that a new NFT record was created in the database
    const createdNft = await prisma.builderNft.findFirst({
      where: {
        builderId: builder.id,
        chainId: nftChain.id,
        contractAddress: mockContractAddress,
        season: mockSeason
      }
    });

    expect(createdNft).not.toBeNull();
    expect(createdNft?.builderId).toBe(builder.id);
    expect(createdNft?.season).toBe(mockSeason);
    expect(createdNft?.chainId).toBe(nftChain.id);
    expect(createdNft?.contractAddress).toBe(mockContractAddress);
  });

  it('should return existing builder NFT if already registered', async () => {
    const builder = await mockBuilder();
    const existingNft = await mockBuilderNft({
      builderId: builder.id,
      season: mockSeason,
      chainId: nftChain.id,
      contractAddress: getNFTContractAddress(mockSeason)
    });

    const result = await registerDeveloperNFT({
      builderId: builder.id,
      season: mockSeason,
      contractAddress: getNFTContractAddress(mockSeason)
    });

    expect(result?.id).toEqual(existingNft.id);
    expect(getNFTMinterClient()!.registerBuilderToken).not.toHaveBeenCalled();
  });
});
