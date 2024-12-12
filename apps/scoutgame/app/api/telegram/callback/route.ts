import { getSession } from '@packages/scoutgame/session/getSession';
import { validateTelegramData } from '@packages/scoutgame/telegram/validate';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

import { connectTelegramAccount } from 'lib/telegram/connectTelegramAccount';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.scoutId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const searchParams = new URLSearchParams(req.nextUrl.searchParams);
  const telegramData = Object.fromEntries(searchParams.entries());

  // TODO: Add validation back after testing
  // const telegramData = validateTelegramData(searchParams);
  const telegramId = Number(telegramData.id);
  if (!telegramId) {
    return NextResponse.redirect(new URL('/accounts?error=invalid_telegram_data', req.url));
  }

  await connectTelegramAccount({ telegramId, userId: session.scoutId });

  // Store telegram data in cookies without httpOnly flag to be able to access it in the frontend
  cookies().set('telegram-data', JSON.stringify(telegramData), {
    httpOnly: false
  });

  return NextResponse.redirect(new URL('/accounts', req.url));
}
