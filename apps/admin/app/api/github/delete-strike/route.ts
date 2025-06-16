import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextRequest } from 'next/server';

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const strikeId = searchParams.get('strikeId');
  if (!strikeId) {
    return Response.json({ error: 'Strike ID is required' }, { status: 400 });
  }
  // Delete the strike
  const strike = await prisma.builderStrike.update({
    where: {
      id: strikeId
    },
    data: {
      deletedAt: new Date()
    }
  });

  const totalActiveStrikes = await prisma.builderStrike.count({
    where: {
      builderId: strike.builderId,
      deletedAt: null
    }
  });

  if (totalActiveStrikes < 3) {
    await prisma.scout.update({
      where: {
        id: strike.builderId
      },
      data: {
        builderStatus: 'approved'
      }
    });
  }

  log.info('Builder strike marked as deleted', { builderId: strike.builderId, strikeId });

  return Response.json({ success: true });
}
