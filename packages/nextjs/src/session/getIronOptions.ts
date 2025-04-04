import { baseUrl, cookieName, authSecret, isTestEnv } from '@packages/utils/constants';
import type { SessionOptions } from 'iron-session';

// when running with ngrok or local tunnel
const isLocalTunnel = process.env.IS_LOCAL_TUNNEL === 'true';

export function getIronOptions({
  sameSite = 'lax',
  ...restOptions
}: SessionOptions['cookieOptions'] = {}): SessionOptions {
  const ironOptions: SessionOptions = {
    cookieName,
    password: authSecret || '',
    cookieOptions: {
      sameSite: isLocalTunnel ? 'none' : sameSite,
      // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
      // When same site is none secure must be true
      secure: isLocalTunnel || isTestEnv ? true : typeof baseUrl === 'string' && baseUrl.includes('https'),
      ...restOptions
    }
  };
  return ironOptions;
}
