import { getSession } from '@packages/scoutgame/session/getSession';
import { validateTelegramData } from '@packages/scoutgame/telegram/validate';
import type { NextRequest } from 'next/server';

import { connectTelegramAccount } from 'lib/telegram/connectTelegramAccount';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.scoutId) {
    return new Response('Authentication required', { status: 401 });
  }

  const telegramData = validateTelegramData(req.nextUrl.searchParams.toString());
  const telegramId = telegramData.user?.id;
  if (!telegramId) {
    return new Response('Invalid Telegram data', { status: 400 });
  }

  const existingTelegramUser = await connectTelegramAccount({ telegramId, userId: session.scoutId });

  return new Response(JSON.stringify({ success: true, connectedUser: existingTelegramUser }));
}
