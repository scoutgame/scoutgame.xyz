import { log } from '@charmverse/core/log';
import { getCurrentWeek } from '@packages/dates/utils';
import {
  getRankedNewScoutsForCurrentWeek,
  getRankedNewScoutsForPastWeek
} from '@packages/scoutgame/scouts/getNewScouts';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return new Response('Week parameter is required', { status: 400 });
  }

  const isCurrentWeek = week === getCurrentWeek();
  const newScouts = isCurrentWeek
    ? await getRankedNewScoutsForCurrentWeek()
        .catch((error) => {
          log.error('Error getting ranked new scouts for current week', { error, week });
          return [];
        })
        .then((scouts) =>
          scouts.map((scout) => {
            return {
              path: scout.path,
              displayName: scout.displayName,
              pointsEarned: scout.pointsPredicted,
              starterPackNfts: scout.starterPacks,
              seasonNfts: scout.nftsHeld - scout.starterPacks,
              wallets: scout.address
            };
          })
        )
    : await getRankedNewScoutsForPastWeek({ week }).then((scouts) =>
        scouts.map((scout) => {
          return {
            path: scout.path,
            displayName: scout.displayName,
            pointsEarned: scout.pointsEarned,
            starterPackNfts: scout.starterPacks,
            seasonNfts: scout.nftsHeld - scout.starterPacks,
            wallets: scout.address
          };
        })
      );

  return respondWithTSV(newScouts.slice(0, 10), `partners-export_optimism_new_scouts_${week}.tsv`);
}
