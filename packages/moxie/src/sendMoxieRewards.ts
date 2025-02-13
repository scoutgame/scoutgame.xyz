import { POST } from '@charmverse/core/http';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { v4 } from 'uuid';

import type { MoxieBonusRow } from './getMoxieCandidates';

type CandidateInput = {
  fid: number;
  amount: number;
};

type Candidate = {
  entityType: 'USER';
  entityId: string;
  amount: string; // in gwei
};
export async function sendMoxieRewards({ week, candidates }: { week: string; candidates: MoxieBonusRow[] }) {
  const season = getCurrentSeasonStart(week);
  const data: CandidateInput[] = candidates.map(({ 'Scout FID': fid, 'Moxie tokens earned': amount }) => ({
    fid,
    amount
  }));

  const response = await sendMoxieTokens(data);

  await prisma.partnerRewardEvent.createMany({
    data: candidates.map(({ 'Scout ID': userId, 'Moxie tokens earned': amount }) => ({
      reward: {
        amount
      },
      week,
      partner: 'moxie',
      season,
      userId
    }))
  });

  log.info('Moxie rewards sent', { week, season, candidates: candidates.length, response });

  return candidates;
}

export function sendMoxieTokens(data: CandidateInput[]) {
  const formattedData: Candidate[] = data.map(({ fid, amount }) => ({
    entityType: 'USER',
    entityId: fid.toString(),
    amount: BigInt(amount * 1e18).toString()
  }));
  return POST(
    `https://rewards.moxie.xyz/partners/${process.env.MOXIE_PARTNER_ID}/events`,
    {
      id: v4(),
      timestamp: new Date().toISOString(),
      data: formattedData
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MOXIE_API_KEY}`
      }
    }
  );
}
