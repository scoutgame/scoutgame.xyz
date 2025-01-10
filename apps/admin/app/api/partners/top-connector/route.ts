import { getLastWeek } from '@packages/dates/utils';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';
import { getScoutsForTopConnectorPartner } from 'lib/partners/getScoutsForTopConnectorPartner';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();
  const rows = await getScoutsForTopConnectorPartner({ week: lastWeek });

  return respondWithTSV(rows, `partners-export_supersim_${lastWeek}.tsv`);
}
