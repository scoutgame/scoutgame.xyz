import { prisma } from '@charmverse/core/prisma-client';

import { BasicUserInfoSelect } from './queries';

export async function getFriends(userId?: string) {
  if (!userId) {
    return [];
  }

  const friends = await prisma.referralCodeEvent.findMany({
    where: {
      builderEvent: { builderId: userId }
    },
    include: {
      referee: {
        select: BasicUserInfoSelect
      }
    }
  });

  return friends.map((friend) => friend.referee);
}
