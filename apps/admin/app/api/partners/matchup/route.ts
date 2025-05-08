import { getMatchupRewards } from '@packages/matchup/getMatchupRewards';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return new Response('Week parameter is required', { status: 400 });
  }

  const { tokenWinners, freeMatchupWinners } = await getMatchupRewards(week);
  const rows = [...tokenWinners, ...freeMatchupWinners];
  return respondWithTSV(rows, `partners-export_matchup_${week}.tsv`);
}
