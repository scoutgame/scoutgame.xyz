import { getMoxieCandidates } from '@packages/moxie/getMoxieCandidates';
import { currentSeason, getLastWeek } from '@packages/scoutgame/dates/utils';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();

  const rows = await getMoxieCandidates({ week: lastWeek, season: getCurrentSeasonStart() });

  return respondWithTSV(rows, `moxie-bonus_${lastWeek}.tsv`);
}
