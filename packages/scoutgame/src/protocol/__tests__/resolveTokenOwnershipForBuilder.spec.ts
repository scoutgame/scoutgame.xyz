import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import {
  mockBuilder,
  mockBuilderNft,
  mockNFTBurnEvent,
  mockNFTPurchaseEvent,
  mockNFTTransferEvent,
  mockScout
} from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';
import type { Address } from 'viem';

import { resolveTokenOwnershipForBuilder } from '../resolveTokenOwnershipForBuilder';

describe('resolveTokenOwnershipForBuilder', () => {
  it('should correctly resolve token ownership for a builder, including transfers and burns', async () => {
    const builder = await mockBuilder();

    const season = getCurrentSeasonStart(getCurrentWeek());

    const purchaseWeek = season;

    const mockBuilderDefaultNft = await mockBuilderNft({
      builderId: builder.id,
      season,
      nftType: 'default'
    });

    const mockBuilderStarterPackNft = await mockBuilderNft({
      builderId: builder.id,
      season,
      nftType: 'starter_pack'
    });

    const secondBuilder = await mockBuilder();

    const secondBuilderDefaultNft = await mockBuilderNft({
      builderId: secondBuilder.id,
      season,
      nftType: 'default'
    });

    const secondBuilderStarterPackNft = await mockBuilderNft({
      builderId: secondBuilder.id,
      season,
      nftType: 'starter_pack'
    });

    const mockScoutWallet1 = randomWalletAddress();
    const mockScoutWallet1Secondary = randomWalletAddress();
    const mockScout1 = await mockScout({
      wallets: [mockScoutWallet1, mockScoutWallet1Secondary]
    });

    await mockNFTPurchaseEvent({
      builderId: builder.id,
      season,
      nftType: 'default',
      scoutId: mockScout1.id,
      tokensPurchased: 10,
      week: purchaseWeek
    });

    await mockNFTPurchaseEvent({
      builderId: builder.id,
      season,
      nftType: 'starter_pack',
      scoutId: mockScout1.id,
      tokensPurchased: 1,
      week: purchaseWeek
    });

    await mockNFTPurchaseEvent({
      builderId: secondBuilder.id,
      season,
      nftType: 'default',
      scoutId: mockScout1.id,
      tokensPurchased: 5,
      week: purchaseWeek
    });

    await mockNFTPurchaseEvent({
      builderId: secondBuilder.id,
      season,
      nftType: 'default',
      scoutId: mockScout1.id,
      tokensPurchased: 12,
      week: purchaseWeek,
      walletAddress: mockScoutWallet1Secondary
    });

    await mockNFTPurchaseEvent({
      builderId: secondBuilder.id,
      season,
      nftType: 'starter_pack',
      scoutId: mockScout1.id,
      tokensPurchased: 1,
      week: purchaseWeek,
      walletAddress: mockScoutWallet1Secondary
    });

    const mockScoutWallet2 = randomWalletAddress();
    const mockScout2 = await mockScout({
      wallets: [mockScoutWallet2]
    });

    await mockNFTPurchaseEvent({
      builderId: secondBuilder.id,
      season,
      nftType: 'starter_pack',
      scoutId: mockScout2.id,
      tokensPurchased: 1,
      week: purchaseWeek
    });

    const mockScoutWallet3 = randomWalletAddress();
    const mockScout3 = await mockScout({
      wallets: [mockScoutWallet3]
    });

    await mockNFTPurchaseEvent({
      builderId: secondBuilder.id,
      season,
      nftType: 'default',
      scoutId: mockScout3.id,
      tokensPurchased: 2,
      week: purchaseWeek
    });

    await mockNFTPurchaseEvent({
      builderId: secondBuilder.id,
      season,
      nftType: 'default',
      scoutId: mockScout3.id,
      tokensPurchased: 7,
      week: purchaseWeek
    });

    await mockNFTPurchaseEvent({
      builderId: secondBuilder.id,
      season,
      nftType: 'starter_pack',
      scoutId: mockScout3.id,
      tokensPurchased: 1,
      week: purchaseWeek
    });

    const { byScoutId: byScoutIdBuilder1, byWallet: byWalletBuilder1 } = await resolveTokenOwnershipForBuilder({
      builderId: builder.id,
      week: getCurrentWeek()
    });

    expect(byScoutIdBuilder1).toEqual([
      {
        scoutId: mockScout1.id,
        totalNft: 10,
        totalStarter: 1
      }
    ]);

    expect(byWalletBuilder1).toEqual([{ wallet: mockScoutWallet1.toLowerCase(), totalNft: 10, totalStarter: 1 }]);

    const { byScoutId: byScoutIdBuilder2, byWallet: byWalletBuilder2 } = await resolveTokenOwnershipForBuilder({
      builderId: secondBuilder.id,
      week: getCurrentWeek()
    });

    expect(byScoutIdBuilder2).toEqual([
      { scoutId: mockScout1.id, totalNft: 17, totalStarter: 1 },
      { scoutId: mockScout2.id, totalNft: 0, totalStarter: 1 },
      { scoutId: mockScout3.id, totalNft: 9, totalStarter: 1 }
    ]);

    expect(byWalletBuilder2).toEqual([
      { wallet: mockScoutWallet1.toLowerCase(), totalNft: 5, totalStarter: 0 },
      { wallet: mockScoutWallet1Secondary.toLowerCase(), totalNft: 12, totalStarter: 1 },
      { wallet: mockScoutWallet2.toLowerCase(), totalNft: 0, totalStarter: 1 },
      { wallet: mockScoutWallet3.toLowerCase(), totalNft: 9, totalStarter: 1 }
    ]);

    // Perform burns and transfers
    await mockNFTBurnEvent({
      builderId: secondBuilder.id,
      season,
      nftType: 'default',
      walletAddress: mockScoutWallet3,
      tokensBurned: 3,
      week: purchaseWeek
    });

    await mockNFTTransferEvent({
      builderId: secondBuilder.id,
      season,
      nftType: 'default',
      from: mockScoutWallet1,
      to: mockScoutWallet1Secondary,
      tokensTransferred: 3,
      week: purchaseWeek
    });

    await mockNFTTransferEvent({
      builderId: secondBuilder.id,
      season,
      nftType: 'default',
      from: mockScoutWallet1Secondary,
      to: mockScoutWallet2,
      tokensTransferred: 3,
      week: purchaseWeek
    });

    const { byScoutId: byScoutIdBuilder2AfterEvents, byWallet: byWalletBuilder2AfterEvents } =
      await resolveTokenOwnershipForBuilder({
        builderId: secondBuilder.id,
        week: getCurrentWeek()
      });

    expect(byScoutIdBuilder2AfterEvents).toEqual([
      { scoutId: mockScout1.id, totalNft: 14, totalStarter: 1 },
      { scoutId: mockScout2.id, totalNft: 3, totalStarter: 1 },
      { scoutId: mockScout3.id, totalNft: 0, totalStarter: 1 }
    ]);

    expect(byWalletBuilder2AfterEvents).toEqual([
      { wallet: mockScoutWallet1.toLowerCase(), totalNft: 10, totalStarter: 1 },
      { wallet: mockScoutWallet1Secondary.toLowerCase(), totalNft: 12, totalStarter: 1 },
      { wallet: mockScoutWallet2.toLowerCase(), totalNft: 3, totalStarter: 1 },
      { wallet: mockScoutWallet3.toLowerCase(), totalNft: 0, totalStarter: 1 }
    ]);
  });
});
