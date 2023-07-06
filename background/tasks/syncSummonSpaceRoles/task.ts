import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { syncSpaceRole } from 'lib/summon/syncSpaceRole';

export async function syncSummonSpaceRoles() {
  const spaces = await prisma.space.findMany({
    select: {
      id: true
    },
    where: {
      xpsEngineId: {
        not: null
      }
    }
  });

  const spaceIds = spaces.map((space) => space.id);

  log.debug('Number of spaces with a Summon tenant ID', spaceIds.length);

  for (const spaceId of spaceIds) {
    try {
      await syncSpaceRole({ spaceId });
    } catch (err: any) {
      log.error(`Error syncing space role for space ${spaceId}: ${err.stack || err.message || err}`, { err });
    }
  }
}
