import { getPlatform } from '@packages/mixpanel/platform';
import type { SessionOptions } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { getIronOptions } from './getIronOptions';
import type { SessionData } from './interfaces';

export async function getSession<T extends object = SessionData>(cookieOptions?: SessionOptions['cookieOptions']) {
  const platform = getPlatform();
  const options = getIronOptions({ sameSite: platform === 'telegram' ? 'none' : undefined, ...cookieOptions });

  const session = await getIronSession<T>(cookies(), options);

  return session;
}
