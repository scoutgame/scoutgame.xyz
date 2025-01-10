'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { registerScout as registerBeehiiv } from '@packages/beehiiv/registerScout';
import { registerScout as registerLoops } from '@packages/loops/registerScout';
import { getPlatform } from '@packages/mixpanel/utils';
import { isValidEmail } from '@packages/utils/strings';

import { sendVerificationEmail } from './verifyEmail';

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
  if (typeof email !== 'string') {
    throw new Error('Email is required');
  }
  if (!isValidEmail(email)) {
    throw new Error('Email is invalid');
  }

  email = email.trim(); // just in case

  const original = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    },
    include: {
      emailVerifications: true
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
      await registerLoops({ ...updatedUser, oldEmail: original.email }, getPlatform());
      await registerBeehiiv({ ...updatedUser, oldEmail: original.email });
    } catch (error) {
      log.error('Error updating contact with Loop or Beehiiv', { error, userId });
    }
    const isVerified = original.emailVerifications.some((v) => v.email === email && v.completedAt);
    if (!isVerified) {
      await sendVerificationEmail({ userId });
    }
    return { success: true, verificationEmailSent: !isVerified };
  }

  return { success: true };
}
