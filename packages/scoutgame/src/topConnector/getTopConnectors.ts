import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

export type TopConnector = {
  builderId: string;
  path: string;
  referralPoints: number;
  avatar?: string | null;
  displayName: string;
  rank: number;
  address: string;
};

export async function getTopConnectorsOfTheDay(options?: { date?: DateTime }) {
  const date = options?.date || DateTime.utc();
  const startOfDay = date.toUTC().startOf('day').toJSDate();
  const endOfDay = date.toUTC().endOf('day').toJSDate();

  const allPointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      },
      event: {
        type: {
          in: ['referral', 'referral_bonus']
        }
      },
      value: {
        gt: 0
      },
      recipient: {
        deletedAt: null
      }
    },
    select: {
      createdAt: true,
      value: true,
      recipientId: true,
      event: {
        select: {
          builder: {
            select: {
              id: true,
              avatar: true,
              displayName: true,
              path: true,
              wallets: {
                where: {
                  primary: true
                },
                select: {
                  address: true
                }
              }
            }
          }
        }
      }
    }
  });

  return groupBuilderEvents(
    allPointsReceipts
      .flatMap((receipt) => ({
        builder: receipt.event.builder,
        receipt,
        createdAt: receipt.createdAt
      }))
      .filter((event) => event.builder.id === event.receipt.recipientId)
  );
}

/**
 * Get top 5 connectors for today.
 *
 * If userId is in top 5 return the top 5 connectors.
 *
 * If userId is not in top 5 return it in the last position so the user can see their position.
 *
 * If the userId doesn't have any points return the top 5 connectors.
 *
 * @param userId - The user id to check if they are in the top 5.
 */
export async function getTop5ConnectorsToday(userId?: string): Promise<TopConnector[]> {
  const startOfDay = DateTime.utc().startOf('day');

  const topConnectors = await getTopConnectorsOfTheDay({ date: startOfDay });

  // Check if user is below the 5th position
  const userInSortedBuilderArray = topConnectors.find((b, i) => b.builderId === userId && i > 4);

  if (userInSortedBuilderArray) {
    // Return 5 top connectors with the user at the end but not in the top 5
    return topConnectors.slice(0, 4).concat(userInSortedBuilderArray);
  } else {
    // Return 5 top connectors
    return topConnectors.slice(0, 5);
  }
}

export async function getTopConnectorOfTheDay(options?: { date?: DateTime }) {
  const topConnectors = await getTopConnectorsOfTheDay(options);
  return topConnectors.at(0);
}

type PartialUser = {
  avatar: string | null;
  displayName: string;
  path: string;
  wallets?: { address: string }[];
};

/**
 *
 * Group all builder events by builderId and sum points value
 *
 * Convert the object to an array, sort by points value in descending order
 */
function groupBuilderEvents(
  events: { builder: PartialUser | null; receipt: { value: number; recipientId: string | null }; createdAt: Date }[]
) {
  const byBuilder = events.reduce<{
    [id: string]: Omit<PartialUser, 'wallets'> & {
      builderId: string;
      referralPoints: number;
      address: string;
      earliestEventDate: Date;
    };
  }>((acc, event) => {
    const recipientId = event.receipt.recipientId;
    if (!recipientId || !event.builder) {
      return acc;
    }

    const recipientRecord = acc[recipientId];
    const value = event.receipt.value;

    if (recipientRecord) {
      recipientRecord.referralPoints += value;
      recipientRecord.earliestEventDate =
        event.createdAt < recipientRecord.earliestEventDate ? event.createdAt : recipientRecord.earliestEventDate;
    } else if (recipientId) {
      const address = event.builder.wallets?.[0]?.address as string;
      if (!address) {
        log.info('No primary address found for referral champion', {
          userId: recipientId
        });
        return acc;
      }

      acc[recipientId] = {
        builderId: recipientId,
        referralPoints: value,
        avatar: event.builder.avatar,
        displayName: event.builder.displayName,
        path: event.builder.path,
        address,
        earliestEventDate: event.createdAt
      };
    }

    return acc;
  }, {});

  return Object.values(byBuilder)
    .sort((a, b) => {
      const aDate = a.earliestEventDate;
      const bDate = b.earliestEventDate;

      const aPoints = a.referralPoints;
      const bPoints = b.referralPoints;

      if (aPoints === bPoints) {
        return aDate.getTime() - bDate.getTime();
      }
      return bPoints - aPoints;
    })
    .map((b, i) => ({ ...b, rank: i + 1 }));
}
