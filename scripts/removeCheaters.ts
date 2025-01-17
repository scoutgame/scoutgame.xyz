import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { registerScout } from '@packages/beehiiv/registerScout';
import { writeFile } from 'fs/promises';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';
import { deleteMixpanelProfiles } from '@packages/mixpanel/deleteUserProfiles';

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
      nftPurchaseEvents: {
        select: {
          paidInPoints: true
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
async function retrieveNftPurchasesFromDeletedUsers() {
  const purchases = await prisma.nFTPurchaseEvent.findMany({
    where: {
      paidInPoints: true,
      builderNft: {
        season: '2025-W02'
      },
      scout: {
        deletedAt: {
          gt: new Date('2024-12-01')
        }
      }
    },
    orderBy: {
      scout: {
        displayName: 'asc'
      }
    },
    include: {
      scout: true,
      builderNft: {
        include: {
          builder: true
        }
      }
    }
  });
  console.log(purchases.length);
  const columns = 'scout,scout id,builder, builder id,tokenAmount,nft type,txHash';
  const rows = purchases.map(
    (p) =>
      `${p.scout.displayName},${p.scout.id},${p.builderNft.builder.displayName},${p.builderNft.builder.id},${p.tokensPurchased},${p.builderNft.nftType},${p.txHash}`
  );
  await writeFile('purchases.csv', [columns, ...rows].join('\n'));
}

(async () => {
  // const { toDelete } = await checkBotEmail('hsaaouswwc@gmail.com');
  // // // await deleteUsers(toDelete);
  // return;
  // const users = await prisma.scout.findMany({
  //   where: {
  //     id: {
  //       in: [
  //         // 'dd34cd6e-a45d-46d6-9001-e6b896c237d7',
  //         // 'ed002060-c649-4dbe-a545-d5b8a2ac20de',
  //         // 'a8c8a76d-d5e7-466e-a143-6bcf7a6c1e6e',
  //         // '6d79ecc4-95a5-4433-ae21-8259104af10b',
  //         // '308d2e73-ba9b-48e0-a40e-a96a9b901db3',
  //         // 'd7da8ed0-d47f-4574-bccd-60d578b773e3',
  //         // 'fee94ac2-bf9d-46ad-ac27-9596f0d33148',
  //         // '7dd5b942-928d-41c3-b575-b1550f562273',
  //         '26dcf09e-2a65-400b-a0a9-0ff4d9d1b96a'
  //       ]
  //     }
  //   },
  //   select: {
  //     wallets: {
  //       select: {
  //         address: true
  //       }
  //     }
  //   }
  // });
  // console.log(users.map((user) => user.wallets.map((wallet) => wallet.address).join('\n')));
  // const deleted = await prisma.scout.findMany({
  //   where: {
  //     id: 'fb5082f4-b86d-4a9d-ada7-21105ae426ef',
  //     deletedAt: {
  //       gt: new Date('2025-01-08')
  //     }
  //   },
  //   select: {
  //     id: true
  //   }
  // });
  // console.log('to remove', deleted.length);
  // console.log('mixpanel', await deleteMixpanelProfiles(deleted));
  const { toDelete } = await checkReferer('dd34cd6e-a45d-46d6-9001-e6b896c237d7');
  const referrers = await prisma.scout.findMany({
    where: {
      id: {
        in: toDelete
      },
      events: {
        some: {
          type: 'referral'
        }
      }
    }
  });
  console.log(referrers.map((r) => r.id));
  for (const referrer of referrers) {
    const { toDelete } = await checkReferer(referrer.id);
    //await deleteUsers(toDelete);
  }
  // await checkReferer('308d2e73-ba9b-48e0-a40e-a96a9b901db3');
})();
