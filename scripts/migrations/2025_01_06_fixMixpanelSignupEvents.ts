import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { batchImportMixpanelEvent } from '@packages/mixpanel/updateUserProfile';
import { uuidFromNumber } from '@packages/utils/uuid';
import fs from 'node:fs';

async function trackMixpanelSignupEvents(userIds: string[]) {
  const scouts = await prisma.scout.findMany({
    where: {
      id: {
        in: userIds
      },
      onboardedAt: {
        not: null
      }
    },
    select: {
      id: true,
      onboardedAt: true
    }
  });

  try {
    await batchImportMixpanelEvent(
      scouts
        .filter((item): item is { id: string; onboardedAt: Date } => !!item.onboardedAt)
        .map((item, index) => ({
          event: 'sign_up',
          properties: {
            userId: item.id,
            $insert_id: uuidFromNumber(index),
            time: item.onboardedAt.getTime()
          }
        }))
    );
  } catch (err) {
    log.error('There was an error while importing event sign_up', { err });
  }
}

function fixMixpanelSignupEvents() {
  fs.readFile('../../userIds.json', 'utf8', async function (err, data) {
    if (data && !err) {
      const userIds = JSON.parse(data) as { userId: string }[];

      if (Array.isArray(userIds) && userIds.every((item) => !!item.userId)) {
        await trackMixpanelSignupEvents(userIds.map((item) => item.userId));
      }
    }
  });
}

// fixMixpanelSignupEvents()
