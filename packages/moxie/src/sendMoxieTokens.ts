import { POST } from '@charmverse/core/http';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { v4 } from 'uuid';

import type { MoxieBonusRow } from './getMoxieCandidates';

type Candidate = {
  entityType: 'USER';
  entityId: string;
  amount: string;
};

export async function sendMoxieTokens({ week, candidates }: { week: string; candidates: MoxieBonusRow[] }) {
  const data: Candidate[] = candidates.map(({ 'Scout FID': fid, 'Moxie tokens earned': amount }) => ({
    entityType: 'USER',
    entityId: fid.toString(),
    amount: BigInt(amount * 1e18).toString()
  }));

  await POST(
    `https://rewards.moxie.xyz/partners/${process.env.MOXIE_PARTNER_ID}/events`,
    {
      id: v4(),
      timestamp: new Date().toISOString(),
      data
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MOXIE_API_KEY}`
      }
    }
  );

  await prisma.partnerRewardEvent.createMany({
    data: candidates.map(({ 'Scout ID': userId, 'Moxie tokens earned': amount }) => ({
      reward: {
        amount
      },
      week,
      partner: 'moxie',
      season: getCurrentSeasonStart(),
      userId
    }))
  });

  return candidates;
}
