import { log } from '@charmverse/core/log';
import { getMoxieCandidates } from '@packages/moxie/getMoxieCandidates';
import { sendMoxieTokens } from '@packages/moxie/sendMoxieTokens';
import { currentSeason, getLastWeek } from '@packages/scoutgame/dates';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();
  const candidates = await getMoxieCandidates({ week: lastWeek, season: currentSeason });

  if (candidates.length === 0) {
    log.info('No candidates found', { lastWeek, currentSeason });
    return new Response('No candidates found', { status: 204 });
  }

  const candidatesNeedingPayment = candidates.filter((row) => !row['Moxie sent']);

  if (candidatesNeedingPayment.length === 0) {
    log.info('No moxie amounts found', { lastWeek, currentSeason });
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
  log.info('Moxie bonus sent', { lastWeek, currentSeason });

  return respondWithTSV(candidates, `moxie-bonus_${lastWeek}.tsv`);
}
