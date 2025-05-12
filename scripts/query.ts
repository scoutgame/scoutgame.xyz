import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';
console.log(new Date().toISOString());
async function query() {
  const timeLeft = getTimeLeftStr(DateTime.utc(2025, 5, 13).toMillis());
  console.log('Time left:', timeLeft);

  // const scout = await prisma.scout.findFirstOrThrow({
  //   where: {
  //     email: 'mattwad+135@gmail.com'
  //   }
  // });

  const matchups = await prisma.scoutMatchup.findMany({
    where: {
      week: '2025-W20',
      submittedAt: null
    },
    include: {
      scout: true,
      selections: true
    }
  });
  prettyPrint(matchups);
  for (const matchup of matchups) {
    if (matchup.selections.length === 0) {
      await sendEmailNotification({
        userId: matchup.scout.id,
        notificationType: 'matchup_reminder',
        templateVariables: {
          time_left: timeLeft
        }
      });
    }
  }
}
query();

// return the absolute amount of time from the unixTimestamp
function getTimeLeftStr(timestamp: number) {
  const now = new Date();
  const timeLeft = Math.abs(timestamp - now.getTime());

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`;
}
