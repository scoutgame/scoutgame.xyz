import { getLastWeek } from '@packages/dates/utils';
import { getReferralsToReward } from '@packages/scoutgame/quests/getReferralsToReward';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await getReferralsToReward({ week: getLastWeek() });

  return respondWithTSV(rows, `partners-export_referrals.tsv`);
}
