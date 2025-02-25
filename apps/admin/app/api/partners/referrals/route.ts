import { getReferralsToReward } from '@packages/scoutgame/quests/getReferralsToReward';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return new Response('Week parameter is required', { status: 400 });
  }

  const rows = await getReferralsToReward({ week });
  return respondWithTSV(rows, `partners-export_referrals.tsv`);
}
