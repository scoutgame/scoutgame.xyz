import { getBuilderNftStats } from '@packages/scoutgame/builders/getBuilderNftStats';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ builderId: string }> }) {
  const builderId = (await params).builderId;
  const result = await getBuilderNftStats(builderId);
  return Response.json(result);
}
