import { isDevEnv } from '@packages/utils/env';
import type { SessionOptions, IronSession } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { getIronOptions } from './getIronOptions';
import type { SessionData } from './interfaces';

export async function getSession<T extends object = SessionData>(cookieOptions?: SessionOptions['cookieOptions']) {
  const options = getIronOptions({
    // Add same site none to allow telegram and farcaster frames to access the session
    sameSite: isDevEnv ? 'lax' : 'none',
    ...cookieOptions
  });

  const session = await getIronSession<T>(await cookies(), options);

  // allow for a user override in development
  const userOverride = process.env.NODE_ENV === 'development' ? process.env.DEV_USER_ID : undefined;

  if (userOverride) {
    // eslint-disable-next-line no-console
    console.log('Overriding session with user override', { userOverride });
    return { scoutId: userOverride } as unknown as IronSession<T>;
  }

  return session;
}
