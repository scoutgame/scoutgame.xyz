import { respondWithTSV } from 'lib/nextjs/respondWithTSV';
import { getBuildersForPartner } from 'lib/partners/getBuildersForPartner';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return new Response('Week parameter is required', { status: 400 });
  }

  const rows = await getBuildersForPartner({
    week,
    scoutPartnerId: 'celo'
  });

  return respondWithTSV(rows, `partners-export_celo_${week}.tsv`);
}
