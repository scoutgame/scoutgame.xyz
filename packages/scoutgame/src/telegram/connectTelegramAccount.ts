import { prisma } from '@charmverse/core/prisma-client';
import { getUserProfile } from '@packages/users/getUserProfile';

import { completeQuests } from '../quests/completeQuests';

export async function connectTelegramAccount({ telegramId, userId }: { telegramId: number; userId: string }) {
  const connectedUser = await getUserProfile({ telegramId });

  if (connectedUser) {
    if (connectedUser.id === userId) {
      return {};
    }
    return { connectedUser };
  }

  await prisma.scout.update({
    where: { id: userId },
    data: { telegramId }
  });

  await completeQuests(userId, ['link-telegram-account']);
  return {};
}
