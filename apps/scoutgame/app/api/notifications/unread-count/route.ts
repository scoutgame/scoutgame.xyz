import { prisma } from '@charmverse/core/prisma-client';
import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.scoutAppNotification.count({
    where: {
      userId: user.id,
      read: false
    }
  });

  return NextResponse.json({ count });
}
