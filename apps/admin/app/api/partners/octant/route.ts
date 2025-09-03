import { respondWithTSV } from 'lib/nextjs/respondWithTSV';
import { getDevelopersForPartner } from 'lib/partners/getDevelopersForPartner';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return new Response('Week parameter is required', { status: 400 });
  }

  const rows = await getDevelopersForPartner({
    week,
    scoutPartnerId: 'octant'
  });

  return respondWithTSV(rows, `partners-export_octant_${week}.tsv`);
}
