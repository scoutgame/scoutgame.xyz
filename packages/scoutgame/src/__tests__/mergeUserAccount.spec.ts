import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { mergeUserAccount } from '@packages/scoutgame/mergeUserAccount';
import {
  mockBuilder,
  mockBuilderNft,
  mockGemPayoutEvents,
  mockNFTPurchaseEvent,
  mockScout,
  mockScoutedNft
} from '@packages/testing/database';
import { randomIntFromInterval } from '@packages/testing/generators';
import { v4 } from 'uuid';

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

  it('should throw an error if both users own NFTs', async () => {
    const builder = await mockBuilder({ createNft: true });
    const primaryUser = await mockScout();
    const secondaryUser = await mockScout({
      farcasterId: randomIntFromInterval(1, 1000000)
    });
    await Promise.all([
      mockScoutedNft({
        builderId: builder.id,
        scoutId: primaryUser.id
      }),
      mockScoutedNft({
        builderId: builder.id,
        scoutId: secondaryUser.id
      })
    ]);
    await expect(mergeUserAccount({ userId: primaryUser.id, farcasterId: secondaryUser.farcasterId })).rejects.toThrow(
      'Can not merge two accounts with NFTs'
    );
  });

  it('should merge the profiles to secondary user when the selected profile is set to new', async () => {
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
    const { retainedUserId } = await mergeUserAccount({
      selectedProfile: 'new',
      userId: primaryUser.id,
      farcasterId: secondaryUser.farcasterId
    });

    const retainedUser = await prisma.scout.findUniqueOrThrow({
      where: { id: retainedUserId }
    });

    // The walletENS should be retained as it was set on the primary user
    expect(retainedUser.walletENS).toEqual('merged.eth');
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
      farcasterName: 'Merged User',
      wallets: []
    });

    const { retainedUserId, mergedUserId } = await mergeUserAccount({
      userId: primaryUser.id,
      farcasterId: secondaryUser.farcasterId
    });

    // Primary user is merged since its a scout account
    const mergedUser = await prisma.scout.findUniqueOrThrow({
      where: { id: mergedUserId }
    });

    const retainedUser = await prisma.scout.findUniqueOrThrow({
      where: { id: retainedUserId },
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

  xit('should merge stats and events, but not points', async () => {
    const [scout1, scout2] = await Promise.all([mockScout(), mockScout()]);
    const [builder1, builder2] = await Promise.all([
      mockBuilder({
        farcasterId: randomIntFromInterval(1, 1000000)
      }),
      mockBuilder()
    ]);

    const [builderNft1, builderNft2] = await Promise.all([
      mockBuilderNft({
        builderId: builder1.id,
        nftType: 'default',
        season: getCurrentSeasonStart()
      }),
      mockBuilderNft({
        builderId: builder2.id,
        nftType: 'default',
        season: getCurrentSeasonStart()
      })
    ]);

    await Promise.all([
      // Purchase builder 2 nft using scout 1
      mockScoutedNft({
        builderNftId: builderNft2.id,
        scoutId: scout1.id,
        balance: 2
      }),
      // Purchase builder 1 nft using scout 1
      mockScoutedNft({
        builderNftId: builderNft1.id,
        scoutId: scout1.id
      }),
      // Purchase builder 1 nft using scout 2
      mockScoutedNft({
        builderNftId: builderNft1.id,
        scoutId: scout2.id,
        balance: 3
      }),
      // Purchase builder 2 nft using scout 1
      mockNFTPurchaseEvent({
        builderId: builder2.id,
        scoutId: scout1.id,
        points: 150,
        nftType: 'default',
        season: getCurrentSeasonStart(),
        tokensPurchased: 2
      }),
      // Purchase builder 1 nft using scout 1
      mockNFTPurchaseEvent({
        builderId: builder1.id,
        scoutId: scout1.id,
        points: 250,
        nftType: 'default',
        season: getCurrentSeasonStart()
      }),
      // Purchase builder 1 nft using scout 2
      mockNFTPurchaseEvent({
        builderId: builder1.id,
        scoutId: scout2.id,
        points: 100,
        nftType: 'default',
        season: getCurrentSeasonStart(),
        tokensPurchased: 3
      }),
      // Weekly gems payout for builder 1, scout 1 and scout 2 by builder 1
      mockGemPayoutEvents({
        builderId: builder1.id,
        recipients: [
          { id: builder1.id, points: 200, recipientType: 'builder' },
          { id: scout1.id, points: 100, recipientType: 'scout' },
          { id: scout2.id, points: 150, recipientType: 'scout' }
        ],
        season: getCurrentSeasonStart()
      }),
      // Weekly gems payout for builder 2 and scout 1 by builder 2
      mockGemPayoutEvents({
        builderId: builder2.id,
        recipients: [
          { id: builder2.id, points: 250, recipientType: 'builder' },
          { id: scout1.id, points: 500, recipientType: 'scout' },
          { id: builder1.id, points: 200, recipientType: 'scout' }
        ],
        season: getCurrentSeasonStart()
      })
    ]);

    // await claimPoints({ userId: builder1.id });

    const { retainedUserId } = await mergeUserAccount({ userId: scout1.id, farcasterId: builder1.farcasterId });

    const retainedUser = await prisma.scout.findUniqueOrThrow({
      where: { id: retainedUserId },
      include: {
        userSeasonStats: true
      }
    });

    expect(retainedUser.id).toEqual(builder1.id);

    // Builder 1:
    // 250 (selling nft to scout 1) + 100 (selling nft to scout 2) + 200 (gems payout) + 200 (gems payout from builder 2) = 750 points
    // Points earned as builder = 200 points
    // Points earned as scout = 200 points

    expect(retainedUser.currentBalance).toEqual(750);
    expect(retainedUser.userSeasonStats[0].pointsEarnedAsBuilder).toEqual(550);
    expect(retainedUser.userSeasonStats[0].pointsEarnedAsScout).toEqual(200);
    expect(retainedUser.userSeasonStats[0].nftsPurchased).toEqual(3);
    expect(retainedUser.userSeasonStats[0].nftsSold).toEqual(4);
    expect(retainedUser.userSeasonStats[0].nftOwners).toEqual(2);

    // claim points to check that re-calculating points gets the correct result
    await claimPoints({ userId: retainedUserId });

    const retainedUserAfterClaim = await prisma.scout.findUniqueOrThrow({
      where: { id: retainedUserId },
      include: {
        userSeasonStats: true
      }
    });

    expect(retainedUserAfterClaim.currentBalance).toEqual(750);
  });
});
