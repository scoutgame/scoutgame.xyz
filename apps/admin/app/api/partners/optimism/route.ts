import { getRankedNewScoutsForPastWeek } from '@packages/scoutgame/scouts/getNewScouts';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return new Response('Week parameter is required', { status: 400 });
  }

  const scouts = await getRankedNewScoutsForPastWeek({ week });

  const rows = scouts.slice(0, 10).map((scout) => ({
    Path: `https://scoutgame.xyz/u/${scout.path}`,
    'Display Name': scout.displayName,
    'Points Earned': scout.pointsEarned,
    Wallet: scout.wallets?.[0]?.address
  }));

  return respondWithTSV(rows, `partners-export_optimism_new_scouts_${week}.tsv`);
}
