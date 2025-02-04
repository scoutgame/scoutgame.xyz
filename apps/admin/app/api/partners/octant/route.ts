import { getLastWeek } from '@packages/dates/utils';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';
import { getBuildersForPartner } from 'lib/partners/getBuildersForPartner';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();
  const rows = await getBuildersForPartner({
    week: lastWeek,
    bonusPartner: 'octant'
  });

  return respondWithTSV(rows, `partners-export_octant_${lastWeek}.tsv`);
}
