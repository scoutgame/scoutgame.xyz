import { prisma } from '@charmverse/core/prisma-client';
import { getUserProfile } from '@packages/users/getUserProfile';

export async function connectTelegramAccount({ telegramId, userId }: { telegramId: number; userId: string }) {
  const existingTelegramUser = await getUserProfile({ telegramId });

  if (existingTelegramUser) {
    if (existingTelegramUser.id === userId) {
      throw new Error('Telegram account already connected to this user');
    }
    return existingTelegramUser;
  }

  await prisma.scout.update({
    where: { id: userId },
    data: { telegramId }
  });
}
