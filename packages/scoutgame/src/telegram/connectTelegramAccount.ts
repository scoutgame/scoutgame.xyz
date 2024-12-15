import { prisma } from '@charmverse/core/prisma-client';

import { getUserProfile } from '../users/getUserProfile';

export async function connectTelegramAccount({ telegramId, userId }: { telegramId: number; userId: string }) {
  const existingTelegramUser = await getUserProfile({ telegramId });

  if (existingTelegramUser) {
    return existingTelegramUser;
  }

  await prisma.scout.update({
    where: { id: userId },
    data: { telegramId }
  });
}
