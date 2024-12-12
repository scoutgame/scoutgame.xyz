import { prisma } from '@charmverse/core/prisma-client';

import { getConnectedUserAccount } from 'lib/users/getUserAccount';

export async function connectTelegramAccount({ telegramId, userId }: { telegramId: number; userId: string }) {
  const existingTelegramUser = await getConnectedUserAccount({ telegramId });

  if (existingTelegramUser) {
    return {
      ...existingTelegramUser,
      telegramId
    };
  }

  await prisma.scout.update({
    where: { id: userId },
    data: { telegramId }
  });
}
