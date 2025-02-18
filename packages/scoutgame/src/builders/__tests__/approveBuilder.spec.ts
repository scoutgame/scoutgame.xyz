import type { BuilderNft } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { mockBuilder } from '@packages/testing/database';

jest.unstable_mockModule('../../builderNfts/builderRegistration/registerBuilderNFT', () => ({
  registerBuilderNFT: jest.fn().mockResolvedValue({
    id: '1',
    imageUrl: 'https://example.com/image.png'
  } as never)
}));

jest.unstable_mockModule('../../builderNfts/builderRegistration/registerBuilderStarterPackNFT', () => ({
  registerBuilderStarterPackNFT: jest.fn()
}));

jest.unstable_mockModule('../../importReposByUser', () => ({
  importReposByUser: () => new Promise(() => {})
}));

const { approveBuilder } = await import('../approveBuilder');

const { registerBuilderNFT } = await import('../../builderNfts/builderRegistration/registerBuilderNFT');
const { registerBuilderStarterPackNFT } = await import(
  '../../builderNfts/builderRegistration/registerBuilderStarterPackNFT'
);

describe('approveBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should approve a builder and register their NFT', async () => {
    const builder = await mockBuilder();

    await approveBuilder({ builderId: builder.id });

    // Check builder was approved
    const updatedBuilder = await prisma.scout.findUnique({
      where: { id: builder.id }
    });

    expect(updatedBuilder?.builderStatus).toBe('approved');

    // Check NFT was registered
    expect(registerBuilderNFT).toHaveBeenCalledWith(
      expect.objectContaining({
        builderId: builder.id,
        season: getCurrentSeasonStart()
      })
    );

    // Check starter pack NFT was registered
    expect(registerBuilderStarterPackNFT).toHaveBeenCalledWith(
      expect.objectContaining({
        builderId: builder.id,
        season: getCurrentSeasonStart()
      })
    );
  });
});
