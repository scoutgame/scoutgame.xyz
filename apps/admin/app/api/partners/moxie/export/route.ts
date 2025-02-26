import { getMoxieCandidates } from '@packages/moxie/getMoxieCandidates';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return new Response('Week parameter is required', { status: 400 });
  }

  const rows = await getMoxieCandidates({ week });
  return respondWithTSV(rows, `moxie-bonus_${week}.tsv`);
}
