import { prisma } from '@charmverse/core/prisma-client';
import { getIronOptions } from '@connect-shared/lib/session/config';
import { cookieName, isDevEnv } from '@root/config/constants';
import { sealData } from 'iron-session';

const isTestEnv = process.env.REACT_APP_APP_ENV === 'test';

export async function GET(request: Request) {
  if (!isDevEnv && !isTestEnv) {
    return new Response('This endpoint is only available in test environment', { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const userId = searchParams.get('userId');
  if (!userId) {
    return new Response('userId is required', { status: 400 });
  }

  const user = await prisma.scout.findFirstOrThrow({
    where: {
      id: userId
    },
    select: {
      id: true
    }
  });

  const sealedSession = await sealData({ scoutId: user.id }, getIronOptions());

  const response = new Response(JSON.stringify({ user }));

  response.headers.set('Set-Cookie', `${cookieName}=${sealedSession}; HttpOnly; Secure; SameSite=Strict; Path=/`);

  return response;
}
