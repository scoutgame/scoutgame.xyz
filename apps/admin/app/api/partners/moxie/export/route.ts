import {
  getCurrentSeasonStart,
  getDateFromISOWeek,
  getLastWeek,
  getWeekStartEndFormatted
} from '@packages/dates/utils';
import { getMoxieCandidates } from '@packages/moxie/getMoxieCandidates';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();
  const rows = await getMoxieCandidates({ week: lastWeek });

  return respondWithTSV(rows, `moxie-bonus_${lastWeek}.tsv`);
}
