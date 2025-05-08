import { log } from '@charmverse/core/log';
import { getSession } from '@packages/nextjs/session/getSession';
import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { isDevEnv, isTestEnv } from '@packages/utils/constants';
import { NextResponse } from 'next/server';

// This API Route is non-blocking and called on every page load. Use it to refresh things about the current user
export async function GET() {
  const user = await getUserFromSession();
  const session = await getSession();
  if (user?.deletedAt) {
    // Logout the user if they have been deleted
    session.destroy();
    return NextResponse.json(null);
  }
  if ((isDevEnv || isTestEnv) && user === null && (session.scoutId || session.adminId)) {
    log.warn('Destroying session: user is null but session has scoutId or adminId');
    session.destroy();
    return NextResponse.json(user);
  }
  return NextResponse.json(user);
}
