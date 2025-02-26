import { log } from '@charmverse/core/log';
import { getCurrentSeasonStart, getLastWeek } from '@packages/dates/utils';
import { getMoxieCandidates } from '@packages/moxie/getMoxieCandidates';
import { sendMoxieRewards } from '@packages/moxie/sendMoxieRewards';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return new Response('Week parameter is required', { status: 400 });
  }

  const currentSeason = getCurrentSeasonStart(week);
  const candidates = await getMoxieCandidates({ week });

  if (candidates.length === 0) {
    log.warn('No candidates found for moxie', { week, currentSeason });
    return new Response('No candidates found', { status: 204 });
  }

  const candidatesNeedingPayment = candidates.filter((row) => !row['Moxie sent']);

  if (candidatesNeedingPayment.length === 0) {
    log.warn('No moxie amounts found', { week, currentSeason, candidates: candidates.length });
    return new Response('No moxie amounts found', { status: 204 });
  }

  try {
    await sendMoxieRewards({
      week,
      candidates: candidatesNeedingPayment
    });
  } catch (e) {
    log.error('Error posting to moxie', { error: e });
  }
  log.info('Moxie bonus sent', { week, currentSeason, candidatesNeedingPayment: candidatesNeedingPayment.length });

  return respondWithTSV(candidates, `moxie-bonus_${week}.tsv`);
}
