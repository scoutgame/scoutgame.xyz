import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { mockBuilder, mockBuilderNft, mockScout } from '@packages/testing/database';
import { generateRandomEthAddress } from '@packages/testing/random';

import { getAllSeasonNftsWithOwners } from '../getAllSeasonNftsWithOwners';

describe('getAllSeasonNftsWithOwners', () => {
  it('should return the nfts for a specific season along with their owners', async () => {
    const mockPreviousSeason = '2024-TEST11';
    const mockSeason = '2024-TEST12';

    const previousSeasonBuilder = await mockBuilder({});

    const mockPreviousSeasonNft = await mockBuilderNft({
      builderId: previousSeasonBuilder.id,
      season: mockPreviousSeason,
      nftType: BuilderNftType.default
    });

    const mockSeasonBuilder = await mockBuilder({});
    const mockSeasonNft = await mockBuilderNft({
      builderId: mockSeasonBuilder.id,
      season: mockSeason,
      nftType: BuilderNftType.default
    });

    const scoutWallet = generateRandomEthAddress();

    const scout = await mockScout({ wallets: [scoutWallet] });

    await prisma.scoutNft.create({
      data: {
        builderNftId: mockSeasonNft.id,
        balance: 5,
        walletAddress: scoutWallet
      }
    });

    const mockSeasonStarterPackNft = await mockBuilderNft({
      builderId: mockSeasonBuilder.id,
      season: mockSeason,
      nftType: BuilderNftType.starter_pack
    });

    await prisma.scoutNft.create({
      data: {
        builderNftId: mockSeasonStarterPackNft.id,
        balance: 1,
        walletAddress: scoutWallet
      }
    });

    const secondBuilder = await mockBuilder({});
    const secondBuilderNftPreviousSeason = await mockBuilderNft({
      builderId: secondBuilder.id,
      season: mockPreviousSeason,
      nftType: BuilderNftType.default
    });

    const secondBuilderStarterPackNft = await mockBuilderNft({
      builderId: secondBuilder.id,
      season: mockSeason,
      nftType: BuilderNftType.starter_pack
    });

    await prisma.scoutNft.create({
      data: {
        builderNftId: secondBuilderStarterPackNft.id,
        balance: 1,
        walletAddress: scoutWallet
      }
    });

    const nfts = await getAllSeasonNftsWithOwners({ season: mockSeason });

    expect(nfts.default).toHaveLength(1);
    expect(nfts.starter_pack).toHaveLength(2);

    expect(nfts.default[0]).toMatchObject({
      id: mockSeasonNft.id,
      season: mockSeason,
      nftType: BuilderNftType.default,
      nftOwners: expect.arrayContaining([
        expect.objectContaining({
          balance: 5,
          walletAddress: scoutWallet
        })
      ])
    });

    expect(nfts.starter_pack).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: mockSeasonStarterPackNft.id,
          season: mockSeason,
          nftType: BuilderNftType.starter_pack,
          nftOwners: expect.arrayContaining([
            expect.objectContaining({
              balance: 1,
              walletAddress: scoutWallet
            })
          ])
        }),
        expect.objectContaining({
          id: secondBuilderStarterPackNft.id,
          season: mockSeason,
          nftType: BuilderNftType.starter_pack,
          nftOwners: expect.arrayContaining([
            expect.objectContaining({
              balance: 1,
              walletAddress: scoutWallet
            })
          ])
        })
      ])
    );
  });
});
