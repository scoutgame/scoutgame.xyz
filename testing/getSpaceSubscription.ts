import { prisma } from '@charmverse/core/prisma-client';

export async function getSpaceAndSubscription(spaceId: string) {
  return prisma.space.findUnique({
    where: {
      id: spaceId
    },
    include: {
      stripeSubscription: {
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });
}
