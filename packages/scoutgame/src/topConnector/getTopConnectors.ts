import type { PointsReceipt, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

export type TopConnector = {
  builderId: string;
  path: string;
  referralPoints: number;
  avatar?: string | null;
  displayName: string;
  rank: number;
};

/**
 * Get top 5 connectors for today.
 *
 * If userId is in top 5 return the top 5 connectors.
 * If userId is not in top 5 return it in the last position so the user can see their position.
 * If the userId doesn't have any points return the top 5 connectors.
 *
 * @param userId - The user id to check if they are in the top 5.
 */
export async function getTop5ConnectorsToday(userId?: string): Promise<TopConnector[]> {
  const startOfDay = DateTime.utc().startOf('day').toJSDate();

  const allBuilderEvents = await prisma.pointsReceipt.findMany({
    where: {
      createdAt: {
        gte: startOfDay
      },
      event: {
        type: {
          in: ['referral', 'referral_bonus']
        }
      },
      value: {
        gt: 0
      }
    },
    include: {
      recipient: {
        select: {
          avatar: true,
          displayName: true,
          path: true
        }
      }
    }
  });

  // Group all builder events by builderId and sum points value
  // Convert the object to an array, sort by points value in descending order
  const sortedByBuilder = groupBuilderEvents(allBuilderEvents);

  // Check if user is below the 5th position
  const userInSortedBuilderArray = sortedByBuilder.find((b, i) => b.builderId === userId && i > 4);

  if (userInSortedBuilderArray) {
    // Return 5 top connectors with the user at the end but not in the top 5
    return sortedByBuilder.slice(0, 4).concat(userInSortedBuilderArray);
  } else {
    // Return 5 top connectors
    return sortedByBuilder.slice(0, 5);
  }
}

export async function getTopConnectorToday() {
  // Assuming the hour is 00:00:00 UTC time and we need the previous day
  const startOfDay = DateTime.utc().startOf('day').minus({ day: 1 }).toJSDate();

  const allBuilderEvents = await prisma.pointsReceipt.findMany({
    where: {
      createdAt: {
        gte: startOfDay
      },
      event: {
        type: {
          in: ['referral', 'referral_bonus']
        }
      },
      value: {
        gt: 0
      }
    },
    include: {
      recipient: {
        select: {
          avatar: true,
          displayName: true,
          path: true
        }
      }
    }
  });

  const sortedByBuilder = groupBuilderEvents(allBuilderEvents);

  return sortedByBuilder.at(0);
}

type PartialUser = Pick<Scout, 'avatar' | 'displayName' | 'path'>;

/**
 *
 * Group all builder events by builderId and sum points value
 *
 * Convert the object to an array, sort by points value in descending order
 */
function groupBuilderEvents(events: (PointsReceipt & { recipient?: PartialUser | null })[]) {
  const byBuilder = events.reduce<{
    [id: string]: PartialUser & { builderId: string; referralPoints: number };
  }>((acc, event) => {
    if (!event.recipientId || !event.recipient) {
      return acc;
    }

    const recipientRecord = acc[event.recipientId];
    const value = event.value;

    if (recipientRecord) {
      recipientRecord.referralPoints += value;
    } else if (event.recipientId) {
      acc[event.recipientId] = {
        builderId: event.recipientId,
        referralPoints: value,
        avatar: event.recipient.avatar,
        displayName: event.recipient.displayName,
        path: event.recipient.path
      };
    }

    return acc;
  }, {});

  return Object.values(byBuilder)
    .sort((a, b) => b.referralPoints - a.referralPoints)
    .map((b, i) => ({ ...b, rank: i + 1 }));
}
