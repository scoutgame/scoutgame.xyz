import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { DateTime } from 'luxon';

/**
 * Create a BuilderEvent of type 'top_connector' for the given builderId
 */
export async function createTopConnectorEvent({
  builderId,
  referralPoints
}: {
  builderId: string;
  referralPoints: number;
}) {
  await prisma.builderEvent.create({
    data: {
      bonusPartner: 'top-connector',
      description: `${referralPoints}`,
      builderId,
      createdAt: DateTime.utc().toJSDate(),
      season: getCurrentSeasonStart(),
      week: getCurrentWeek(),
      type: 'top_connector'
    }
  });
}
