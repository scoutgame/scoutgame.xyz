import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getStartOfMatchup } from '@packages/matchup/getMatchupDetails';
import { getRelativeTime } from '@packages/utils/dates';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';
console.log(DateTime.fromJSDate(new Date(Date.now() + 122 * 60 * 60 * 1000)).toRelative());
async function query() {
  // const timeLeft = getTimeLeftStr(DateTime.utc(2025, 5, 13).toMillis());

  console.log(new Date().toISOString());
  const timeLeft = getRelativeTime(getStartOfMatchup(getCurrentWeek()));
  console.log('Time left:', timeLeft);
  return;

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
