import { getLastWeek } from '@packages/dates/utils';
import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { checkIsProcessingPayouts } from '@packages/scoutgame/points/checkIsProcessingPayouts';
import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';
import { NextResponse } from 'next/server';

type ClaimablePointsResponse = {
  points: number;
  processingPayouts: boolean;
};

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ points: 0 });
  }

  const processingPayouts = await checkIsProcessingPayouts({ week: getLastWeek() });

  const claimablePoints = await getClaimablePoints({ userId: user.id });
  return NextResponse.json<ClaimablePointsResponse>({ points: claimablePoints.points, processingPayouts });
}
