import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { batchImportMixpanelEvent } from '@packages/mixpanel/updateUserProfile';
import { uuidFromNumber } from '@packages/utils/uuid';
import fs from 'node:fs';
import path from 'node:path';

async function trackMixpanelSignupEvents(userIds: string[]) {
  const scouts = await prisma.scout.findMany({
    where: {
      id: {
        in: userIds
      },
      deletedAt: null
    },
    select: {
      id: true,
      createdAt: true
    }
  });

  try {
    const data = await batchImportMixpanelEvent(
      scouts.map((item, index) => ({
        event: 'sign_up',
        properties: {
          userId: item.id,
          $insert_id: uuidFromNumber(index),
          time: item.createdAt.getTime()
        }
      }))
    );
    log.info('Loaded with success the following event', { event: 'sign_up', data });
  } catch (err) {
    log.error('There was an error while importing event sign_up', { err });
  }
}

function addMixpanelSignupEvents() {
  const filePath = path.join(__dirname, '../../csvjson.json');
  fs.readFile(filePath, 'utf8', async function (err, data) {
    if (data && !err) {
      const userIds = JSON.parse(data) as { userId: string }[];

      if (Array.isArray(userIds) && userIds.every((item) => !!item.userId)) {
        await trackMixpanelSignupEvents(userIds.map((item) => item.userId));
      }
    }

    if (err) {
      log.error('There was an error while reading the json file', { err });
    }
  });
}

addMixpanelSignupEvents();
