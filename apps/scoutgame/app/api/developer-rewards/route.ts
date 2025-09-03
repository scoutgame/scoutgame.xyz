import { getSession } from '@packages/nextjs/session/getSession';
import { getWeeklyDeveloperRewards } from '@packages/scoutgame/builders/getDeveloperRewards';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await getSession();
  const scoutId = session?.scoutId;

  if (!scoutId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');
  if (!week) {
    return new Response('week is required', { status: 400 });
  }

  const weeklyDeveloperRewards = await getWeeklyDeveloperRewards({
    userId: scoutId,
    week
  });

  return NextResponse.json({ success: true, data: weeklyDeveloperRewards });
}
