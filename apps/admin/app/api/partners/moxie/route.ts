import { log } from '@charmverse/core/log';
import { getMoxieCandidates } from '@packages/moxie/getMoxieCandidates';
import { sendMoxieTokens } from '@packages/moxie/sendMoxieTokens';
import { getCurrentSeasonStart, getLastWeek } from '@packages/scoutgame/dates/utils';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();
  const currentSeason = getCurrentSeasonStart(lastWeek);
  const candidates = await getMoxieCandidates({ week: lastWeek });

  if (candidates.length === 0) {
    log.warn('No candidates found for moxie', { lastWeek, currentSeason });
    return new Response('No candidates found', { status: 204 });
  }

  const candidatesNeedingPayment = candidates.filter((row) => !row['Moxie sent']);

  if (candidatesNeedingPayment.length === 0) {
    log.warn('No moxie amounts found', { lastWeek, currentSeason, candidates: candidates.length });
    return new Response('No moxie amounts found', { status: 204 });
  }

  try {
    await sendMoxieTokens({
      week: lastWeek,
      candidates: candidatesNeedingPayment
    });
  } catch (e) {
    log.error('Error posting to moxie', { error: e });
  }
  log.info('Moxie bonus sent', { lastWeek, currentSeason, candidatesNeedingPayment: candidatesNeedingPayment.length });

  return respondWithTSV(candidates, `moxie-bonus_${lastWeek}.tsv`);
}
