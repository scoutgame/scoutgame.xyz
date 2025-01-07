import { getSession as rootGetSession } from '@packages/nextjs/session/getSession';

import type { SessionData } from './interfaces';

export function getSession() {
  return rootGetSession<SessionData>();
}
