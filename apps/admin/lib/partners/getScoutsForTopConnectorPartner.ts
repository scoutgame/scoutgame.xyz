import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

export async function getScoutsForTopConnectorPartner({ days }: { days: number }) {
  const events = await prisma.builderEvent.findMany({
    where: {
      type: 'top_connector',
      createdAt: {
        gte: DateTime.utc().minus({ days }).toJSDate() // How many days ago we want to get the data from
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      createdAt: true,
      description: true,
      builder: {
        select: {
          path: true,
          email: true,
          displayName: true
        }
      }
    }
  });

  return events.map((event) => ({
    'User Name': event.builder.displayName,
    'Profile Link': `https://scoutgame.xyz/u/${event.builder.path}`,
    Email: event.builder.email,
    Date: event.createdAt.toDateString(),
    Points: event.description
  }));
}
