import { prisma } from '@charmverse/core/prisma-client';

export async function getScoutsForTopConnectorPartner({ week }: { week: string }) {
  const events = await prisma.builderEvent.findMany({
    where: {
      type: 'top_connector',
      week
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
