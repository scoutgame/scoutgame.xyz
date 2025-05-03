import { getLastWeek } from '@packages/dates/utils';
import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { checkIsProcessingPayouts } from '@packages/scoutgame/tokens/checkIsProcessingPayouts';
import { getClaimableTokens } from '@packages/scoutgame/tokens/getClaimableTokens';
import { NextResponse } from 'next/server';

type ClaimableTokensResponse = {
  tokens: number;
  processingPayouts: boolean;
};

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ tokens: 0 });
  }

  const processingPayouts = await checkIsProcessingPayouts({ week: getLastWeek() });

  const claimableTokens = await getClaimableTokens({ userId: user.id });
  return NextResponse.json<ClaimableTokensResponse>({ tokens: claimableTokens, processingPayouts });
}
