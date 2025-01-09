import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { registerScout } from '@packages/beehiiv/registerScout';
import { writeFile } from 'fs/promises';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';

async function query() {
  const referrerId = '308d2e73-ba9b-48e0-a40e-a96a9b901db3';

  const userIds = await getData(referrerId);
  console.log('Found', userIds.length, 'cheaters. Examples: ', userIds.slice(1, 5).join(', '));
  await deleteUsers(userIds);
}

async function checkEmail(email: string) {
  const scout = await prisma.scout.findFirst({
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
  if (scout) {
    console.log('Found', scout.id, 'Invited by user', scout.referralCodeEvents[0].builderEvent.builderId);
  }
}

async function getData(scoutId: string) {
  const scout = await prisma.scout.findFirstOrThrow({
    where: { id: scoutId },
    include: {
      socialQuests: true,
      events: {
        where: {
          type: 'referral',
          createdAt: {
            gt: new Date('2025-01-01')
          }
        },
        select: {
          referralCodeEvent: true
        }
      }
    }
  });
  const userIds = scout?.events.map((event) => event.referralCodeEvent!.refereeId);
  return [scoutId, ...userIds];
}

async function deleteUsers(userIds: string[]) {
  console.log(
    'Marked deleted',
    'Cheater Id: ' + userIds[0],
    await prisma.scout.updateMany({ where: { id: { in: userIds } }, data: { deletedAt: new Date() } })
  );
}

//query();
checkEmail('t5a8z9w2zP@gmail.com');
