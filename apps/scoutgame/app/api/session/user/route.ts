import { getSession } from '@packages/scoutgame/session/getSession';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
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
  return NextResponse.json(user);
}
