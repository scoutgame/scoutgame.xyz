import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { writeFile } from 'fs/promises';
// import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';
import { deleteMixpanelProfiles } from '@packages/mixpanel/deleteUserProfiles';
import { getCurrentSeasonStart } from '@packages/dates/utils';

async function checkReferer(referrerId: string) {
  const { referrer, toDelete } = await getData(referrerId);
  console.log('Found', toDelete.length, 'cheaters. Examples: ', toDelete.slice(1, 5).join(', '));
  // console.log('Referrer: ', referrer);

  await checkBotUsers(toDelete.slice(1));
  return { referrer, toDelete };
}

async function checkBotEmail(email: string) {
  const scout = await prisma.scout.findFirstOrThrow({
    where: { email },
    include: {
      socialQuests: true,
      referralCodeEvents: {
        include: {
          builderEvent: true
        }
      }
    }
  });
  const referrerId = scout.referralCodeEvents[0].builderEvent.builderId;
  console.log('Found', scout.id, scout.deletedAt ? '(deleted)' : '', 'Invited by user', referrerId);
  return checkReferer(referrerId);
}

async function getData(scoutId: string) {
  const { events, ...referrer } = await prisma.scout.findFirstOrThrow({
    where: { id: scoutId },
    include: {
      socialQuests: true,
      events: {
        where: {
          type: 'referral'
        },
        select: {
          referralCodeEvent: true
        }
      },
      wallets: {
        select: {
          purchaseEvents: {
            select: {
              paidInPoints: true
            }
          }
        }
      }
    }
  });
  const userIds = events.map((event) => event.referralCodeEvent!.refereeId);
  return { referrer, toDelete: [scoutId, ...userIds] };
}

async function deleteUsers(userIds: string[]) {
  console.log(
    'Bots deleted...',
    'Cheater Id: ' + userIds[0],
    await prisma.scout.updateMany({ where: { id: { in: userIds }, deletedAt: null }, data: { deletedAt: new Date() } })
  );
  console.log('Removed from mixpanel:', await deleteMixpanelProfiles(userIds.map((id) => ({ id }))));
}

async function checkBotUsers(userIds: string[]) {
  // const users = await prisma.scout.findMany({
  //   where: { id: { in: userIds }, nftPurchaseEvents: { some: {} } },
  //   select: { email: true, nftPurchaseEvents: true }
  // });
  // console.log(
  //   'Bots to review',
  //   users.map((user) => user.email + ' ' + user.nftPurchaseEvents.map((event) => event.paidInPoints))
  // );
  const notYetDeleted = await prisma.scout.count({
    where: { id: { in: userIds }, deletedAt: null }
  });
  console.log('Bots to delete', notYetDeleted, 'of', userIds.length);
}

// get purchases from Deleted users
async function retrieveNftPurchasesFromDeletedUsers(filename: string) {
  const purchases = await prisma.nFTPurchaseEvent.findMany({
    where: {
      paidInPoints: true,
      builderNft: {
        season: getCurrentSeasonStart()
      },
      scoutWallet: {
        scout: {
          deletedAt: {
            gt: new Date('2025-01-01')
          }
        }
      }
    },
    // orderBy: {
    //   scout: {
    //     displayName: 'asc'
    //   }
    // },
    include: {
      scoutWallet: {
        include: {
          scout: {
            include: {
              mergedFromEvents: true,
              mergedToEvents: true
            }
          }
        }
      },
      builderNft: {
        include: {
          builder: true
        }
      }
    }
  });
  console.log('Found', purchases.length, 'transactions to delete');
  const columns = 'scout,scout id,deleted,deleted at,builder, builder id,tokenAmount,nft type,txHash';
  const rows = purchases.map(
    (p) =>
      `${p.scoutWallet!.scout.displayName},${p.scoutWallet!.scout.id},${p.scoutWallet!.scout.deletedAt?.toISOString()},${p.scoutWallet!.scout.deletedAt?.toDateString()},${p.builderNft.builder.displayName},${p.builderNft.builder.id},${p.tokensPurchased},${p.builderNft.nftType},${p.txHash}`
  );
  await writeFile(filename, [columns, ...rows].join('\n'));
  console.log('Saved to', filename);
}

(async () => {
  // const { toDelete } = await checkBotEmail('hsaaouswwc@gmail.com');
  // const { toDelete } = await checkReferer('dd34cd6e-a45d-46d6-9001-e6b896c237d7');
  // const referrers = await prisma.scout.findMany({
  //   where: {
  //     id: {
  //       in: toDelete
  //     },
  //     events: {
  //       some: {
  //         type: 'referral'
  //       }
  //     }
  //   }
  // });
  // console.log(referrers.map((r) => r.id));

  await retrieveNftPurchasesFromDeletedUsers('transactions.csv');
})();
