import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';
async function query() {
  const scout = await prisma.scoutSocialQuest.updateMany({
    where: { season: null },
    data: { season: '2024-W41' }
  });
  prettyPrint(scout);
  // await sendPointsForMiscEvent({
  //   builderId: scout!.id,
  //   points: 50,
  //   claimed: true,
  //   description: 'Refund for suspended builders: futreall and mdqst',
  //   hideFromNotifications: true,
  //   earnedAs: 'scout'
  // });
}

query();
