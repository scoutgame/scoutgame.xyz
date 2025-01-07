'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { deleteSubscriptionByEmail as deleteBeehiivSubscription } from '@packages/beehiiv/deleteSubscriptionByEmail';
import { registerScout as registerBeehiiv } from '@packages/beehiiv/registerScout';
import { deleteContact as deleteLoopsContact } from '@packages/loops/client';
import { registerScout as registerLoops } from '@packages/loops/registerScout';
import { getPlatform } from '@packages/mixpanel/utils';

export async function updateUserEmailSettings({
  userId,
  email,
  sendMarketing,
  sendTransactionEmails
}: {
  userId: string;
  email: string;
  sendMarketing: boolean;
  sendTransactionEmails: boolean;
}) {
  const original = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    }
  });
  const updatedUser = await prisma.scout.update({
    where: { id: userId },
    data: {
      email,
      sendTransactionEmails,
      sendMarketing
    }
  });

  if (original.email !== updatedUser.email || original.sendMarketing !== updatedUser.sendMarketing) {
    try {
      if (!updatedUser.email) {
        // remove from Loops and Beehiiv
        await deleteLoopsContact({ email: original.email! });
        await deleteBeehiivSubscription({ email: original.email! });
      } else {
        await registerLoops({ ...updatedUser, oldEmail: original.email }, getPlatform());
        await registerBeehiiv({ ...updatedUser, oldEmail: original.email });
      }
    } catch (error) {
      log.error('Error updating contact with Loop or Beehiiv', { error, userId });
    }
  }

  return { success: true };
}
