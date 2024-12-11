import { getSession } from '@packages/scoutgame/session/getSession';
import { validateTelegramData } from '@packages/scoutgame/telegram/validate';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.scoutId) {
    return new Response('Authentication required', { status: 401 });
  }

  // console.log(req.nextUrl.searchParams.toString());
  const telegramData = validateTelegramData(req.nextUrl.searchParams.toString());
  return new Response('OK');
}
