import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { currentSeason } from '../../dates';
import { claimPoints } from '../../points/claimPoints';
import {
  mockBuilder,
  mockBuilderNft,
  mockGemPayoutEvent,
  mockGemPayoutEvents,
  mockNFTPurchaseEvent,
  mockScout
} from '../../testing/database';
import { randomIntFromInterval } from '../../testing/generators';
import { mergeUserAccount } from '../mergeUserAccount';

describe('mergeUserAccount', () => {
  it('should throw an error if no account identities are provided', async () => {
    await expect(mergeUserAccount({ userId: '1' })).rejects.toThrow('No account identities to merge');
  });

  it('should throw an error if both accounts are builder accounts', async () => {
    const primaryUser = await mockBuilder();
    const secondaryUser = await mockBuilder({
      farcasterId: randomIntFromInterval(1, 1000000)
    });
    await expect(mergeUserAccount({ userId: primaryUser.id, farcasterId: secondaryUser.farcasterId })).rejects.toThrow(
      'Can not merge two builder accounts'
    );
  });

  it('should throw an error if both accounts are the same', async () => {
    const user = await mockScout({
      farcasterId: randomIntFromInterval(1, 1000000)
    });
    await expect(mergeUserAccount({ userId: user.id, farcasterId: user.farcasterId })).rejects.toThrow(
      'Can not merge the same account'
    );
  });

  it('should throw an error if any of the accounts are deleted', async () => {
    const primaryUser = await mockScout();
    const secondaryUser = await mockScout({
      deletedAt: new Date(),
      farcasterId: randomIntFromInterval(1, 1000000)
    });
    await expect(mergeUserAccount({ userId: primaryUser.id, farcasterId: secondaryUser.farcasterId })).rejects.toThrow(
      'Can not merge deleted accounts'
    );
  });

  it('should throw an error if the selected profile is provided when any of the accounts is a builder', async () => {
    const primaryUser = await mockScout();
    const secondaryUser = await mockBuilder({
      farcasterId: randomIntFromInterval(1, 1000000)
    });
    await expect(
      mergeUserAccount({ selectedProfile: 'current', userId: primaryUser.id, farcasterId: secondaryUser.farcasterId })
    ).rejects.toThrow('Can not merge builder account profiles');
  });

  it('should merge the profiles but retain walletENS when the selected profile is set to new', async () => {
    const primaryUser = await mockScout({
      walletENS: 'primary.eth'
    });
    const secondaryUser = await mockScout({
      farcasterId: randomIntFromInterval(1, 1000000),
      displayName: 'Merged User',
      bio: 'Merged User Bio',
      avatar: 'Merged User Avatar',
      email: 'merged@user.com',
      walletENS: 'merged.eth'
    });
    await mergeUserAccount({ selectedProfile: 'new', userId: primaryUser.id, farcasterId: secondaryUser.farcasterId });

    const retainedUser = await prisma.scout.findUniqueOrThrow({
      where: { id: primaryUser.id }
    });

    // The walletENS should be retained as it was set on the primary user
    expect(retainedUser.walletENS).toEqual('primary.eth');
    expect(retainedUser.displayName).toEqual('Merged User');
    expect(retainedUser.bio).toEqual('Merged User Bio');
    expect(retainedUser.avatar).toEqual('Merged User Avatar');
    expect(retainedUser.email).toEqual('merged@user.com');
  });

  it(`should detach the identities of the merged user and attach them to the retained user`, async () => {
    const wallets = [v4(), v4()];
    const primaryUser = await mockScout({
      telegramId: randomIntFromInterval(1, 1000000),
      email: 'merged@user.com',
      wallets
    });
    const secondaryUser = await mockBuilder({
      farcasterId: randomIntFromInterval(1, 1000000),
      farcasterName: 'Merged User'
    });

    await mergeUserAccount({ userId: primaryUser.id, farcasterId: secondaryUser.farcasterId });

    // Primary user is merged since its a scout account
    const mergedUser = await prisma.scout.findUniqueOrThrow({
      where: { id: primaryUser.id }
    });

    const retainedUser = await prisma.scout.findUniqueOrThrow({
      where: { id: secondaryUser.id },
      include: {
        wallets: true
      }
    });

    expect(mergedUser.deletedAt).not.toBeNull();
    expect(mergedUser.farcasterId).toBeNull();
    expect(mergedUser.farcasterName).toBeNull();
    expect(mergedUser.email).toBeNull();
    expect(mergedUser.telegramId).toBeNull();

    expect(retainedUser.wallets).toHaveLength(2);
    expect(retainedUser.wallets.map((wallet) => wallet.address).sort()).toEqual(wallets.sort());
    expect(retainedUser.farcasterId).toEqual(secondaryUser.farcasterId);
    expect(retainedUser.farcasterName).toEqual(secondaryUser.farcasterName);
    expect(retainedUser.telegramId).toEqual(primaryUser.telegramId);

    const scoutMergeEvent = await prisma.scoutMergeEvent.findFirstOrThrow({
      where: { mergedFromId: primaryUser.id, mergedToId: secondaryUser.id }
    });

    expect(scoutMergeEvent).toBeTruthy();
  });

  it('should merge stats, points, and events', async () => {
    const [scout1, scout2] = await Promise.all([mockScout(), mockScout()]);
    const [builder1, builder2] = await Promise.all([
      mockBuilder({
        farcasterId: randomIntFromInterval(1, 1000000)
      }),
      mockBuilder()
    ]);

    await Promise.all([
      mockBuilderNft({
        builderId: builder1.id,
        nftType: 'default',
        season: currentSeason
      }),
      mockBuilderNft({
        builderId: builder2.id,
        nftType: 'default',
        season: currentSeason
      })
    ]);

    await Promise.all([
      // Purchase builder 2 nft using scout 1
      mockNFTPurchaseEvent({
        builderId: builder2.id,
        scoutId: scout1.id,
        points: 150,
        nftType: 'default',
        season: currentSeason,
        tokensPurchased: 2
      }),
      // Purchase builder 1 nft using scout 1
      mockNFTPurchaseEvent({
        builderId: builder1.id,
        scoutId: scout1.id,
        points: 250,
        nftType: 'default',
        season: currentSeason
      }),
      // Purchase builder 1 nft using scout 2
      mockNFTPurchaseEvent({
        builderId: builder1.id,
        scoutId: scout2.id,
        points: 100,
        nftType: 'default',
        season: currentSeason
      }),
      // Weekly gems payout for builder 1, scout 1 and scout 2 by builder 1
      mockGemPayoutEvents({
        builderId: builder1.id,
        recipients: [
          { id: builder1.id, points: 200 },
          { id: scout1.id, points: 100 },
          { id: scout2.id, points: 150 }
        ],
        season: currentSeason
      }),
      // Weekly gems payout for builder 2 and scout 1 by builder 2
      mockGemPayoutEvents({
        builderId: builder2.id,
        recipients: [
          { id: builder2.id, points: 250 },
          { id: scout1.id, points: 100 }
        ],
        season: currentSeason
      })
    ]);

    await claimPoints({ userId: builder1.id, season: currentSeason });

    await mergeUserAccount({ userId: scout1.id, farcasterId: builder1.farcasterId });

    const retainedUser = await prisma.scout.findUniqueOrThrow({
      where: { id: builder1.id },
      include: {
        userSeasonStats: true
      }
    });

    // After merge total points = 200 (builder 1 gems payout) + 100 (scout 1 gems payout) + 100 (scout 2 nft purchase) + 250 (scout 1 nft purchase) = 650
    // 250 points was spent to purchase the NFT so 650 - 250 = 400
    // 100 points was not claimed by scout 1 so 400 - 100 = 300 points
    // 150 points was used by scout 1 to purchase the NFT of scout 2 so 300 - 150 = 150 points
    expect(retainedUser.currentBalance).toEqual(150);
    expect(retainedUser.userSeasonStats[0].pointsEarnedAsBuilder).toEqual(650);
    expect(retainedUser.userSeasonStats[0].pointsEarnedAsScout).toEqual(100);
    expect(retainedUser.userSeasonStats[0].nftsPurchased).toEqual(3);
    expect(retainedUser.userSeasonStats[0].nftsSold).toEqual(2);
    expect(retainedUser.userSeasonStats[0].nftOwners).toEqual(2);
  });
});
