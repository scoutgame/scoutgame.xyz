import { getLastWeek } from '@packages/dates/utils';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';
import { getScoutsForTopConnectorPartner } from 'lib/partners/getScoutsForTopConnectorPartner';

export const dynamic = 'force-dynamic';

export async function GET() {
  const daysAgo = 14;
  const lastWeek = getLastWeek();
  const rows = await getScoutsForTopConnectorPartner({ days: daysAgo });

  return respondWithTSV(rows, `partners-export_top_connectors_${lastWeek}.tsv`);
}
