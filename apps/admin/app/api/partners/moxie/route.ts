import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getLastWeek } from '@packages/scoutgame/dates';
import { v4 } from 'uuid';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

import { getMoxieCandidates } from './export/route';

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
    await fetch(`https://rewards.moxie.xyz/partners/${process.env.MOXIE_PARTNER_ID}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MOXIE_API_KEY}`
      },
      body: JSON.stringify({
        id: v4(),
        timestamp: new Date().toISOString(),
        data: candidatesNeedingPayment.map(({ 'Scout FID': fid, 'Moxie tokens earned': amount }) => ({
          fid,
          amount
        }))
      })
    });

    await prisma.partnerRewardEvent.createMany({
      data: candidatesNeedingPayment.map(({ 'Scout ID': userId, 'Moxie tokens earned': amount }) => ({
        reward: {
          amount
        },
        week: lastWeek,
        partner: 'moxie',
        season: currentSeason,
        userId
      }))
    });
  } catch (e) {
    log.error('Error posting to moxie', { error: e });
  }
  log.info('Moxie bonus sent', { lastWeek, currentSeason });

  return respondWithTSV(candidates, `moxie-bonus_${lastWeek}.tsv`);
}
