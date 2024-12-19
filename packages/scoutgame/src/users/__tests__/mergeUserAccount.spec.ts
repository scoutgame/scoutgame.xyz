import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { currentSeason } from '../../dates';
import { claimPoints } from '../../points/claimPoints';
import {
  mockBuilder,
  mockBuilderNft,
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

  it('should throw an error if the merged user has more than 3 starter pack NFTs', async () => {
    const builders = await Promise.all(Array.from({ length: 3 }).map(() => mockBuilder()));
    await Promise.all(
      builders.map((builder) =>
        mockBuilderNft({ builderId: builder.id, nftType: 'starter_pack', season: currentSeason })
      )
    );
    const primaryUser = await mockScout();
    const secondaryUser = await mockScout({
      farcasterId: randomIntFromInterval(1, 1000000)
    });
    await Promise.all([
      ...Array.from({ length: 3 }).map((_, index) =>
        mockNFTPurchaseEvent({
          builderId: builders[index].id,
          nftType: 'starter_pack',
          scoutId: primaryUser.id,
          season: currentSeason
        })
      ),
      mockNFTPurchaseEvent({
        builderId: builders[2].id,
        nftType: 'starter_pack',
        scoutId: secondaryUser.id,
        season: currentSeason
      })
    ]);
    await expect(mergeUserAccount({ userId: primaryUser.id, farcasterId: secondaryUser.farcasterId })).rejects.toThrow(
      'Can not merge more than 3 starter pack NFTs'
    );
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
  });

  it(`should detach the identities of the merged user and attach them to the retained user`, async () => {
    const wallets = [v4(), v4()];
    const primaryUser = await mockScout({
      telegramId: randomIntFromInterval(1, 1000000),
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
      // Purchase builder 2 nft using builder 1
      mockNFTPurchaseEvent({
        builderId: builder2.id,
        scoutId: builder1.id,
        points: 150,
        nftType: 'default',
        season: currentSeason,
        tokensPurchased: 2
      }),
      // Purchase builder 1 nft using scout 2
      mockNFTPurchaseEvent({
        builderId: builder1.id,
        scoutId: scout2.id,
        points: 100,
        nftType: 'default',
        season: currentSeason,
        tokensPurchased: 3
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
          { id: scout1.id, points: 500 },
          { id: builder1.id, points: 200 }
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

    // Builder 1:
    // 250 (selling nft to scout 1) + 100 (selling nft to scout 2) + 200 (gems payout) - 150 (purchasing nft of builder 2) + 200 (gems payout from builder 2) = 600 points
    // Points earned as builder = 200 + 250 + 100 = 550 points
    // Points earned as scout = 200 points

    // Scout 1:
    // - 150 (purchasing nft of builder 2) - 250 (purchasing nft of builder 1) + 100 (gems payout from builder 1) + 500 (gems payout from builder 2) = 200 points
    // Points earned as builder = 0 points
    // Points earned as scout = 100 + 500 = 600 points

    expect(retainedUser.currentBalance).toEqual(200);
    // 550 (points earned as builder by builder 1) + 100 (points earned as scout by builder 1 gems payout)
    expect(retainedUser.userSeasonStats[0].pointsEarnedAsBuilder).toEqual(650);
    expect(retainedUser.userSeasonStats[0].pointsEarnedAsScout).toEqual(700);
    expect(retainedUser.userSeasonStats[0].nftsPurchased).toEqual(5);
    expect(retainedUser.userSeasonStats[0].nftsSold).toEqual(4);
    expect(retainedUser.userSeasonStats[0].nftOwners).toEqual(2);

    await claimPoints({ userId: retainedUser.id, season: currentSeason });

    const retainedUserAfterClaim = await prisma.scout.findUniqueOrThrow({
      where: { id: retainedUser.id },
      include: {
        userSeasonStats: true
      }
    });

    expect(retainedUserAfterClaim.currentBalance).toEqual(800);
  });
});
