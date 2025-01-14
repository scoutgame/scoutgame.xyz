import { getLeaderboard } from '@packages/scoutgame/builders/getLeaderboard';

import { getWeekStartEndFormatted, getDateFromISOWeek } from '@packages/dates/utils';
async function query() {
  // const existingAccounts = await getUserByPath('thescoho');
  // console.log(existingAccounts);
  const week = '2024-W46';

  console.log('Retrieving leaderboard for week:', getWeekStartEndFormatted(getDateFromISOWeek(week).toJSDate()));

  const builders = await getLeaderboard({ week: week });
  console.log('Top Builders');
  console.log(
    builders.map((b, index) => `${index + 1}. https://scoutgame.xyz/u/${b.path} (${b.gemsCollected} gems)`).join('\n')
  );
}

query();
