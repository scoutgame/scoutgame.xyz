'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getPlatform } from '@packages/utils/platform';
import { isValidEmail } from '@packages/utils/strings';

import { sendVerificationEmail } from './verifyEmail';

export async function updateUserEmailSettings({ userId, email }: { userId: string; email?: string }) {
  if (email && !isValidEmail(email)) {
    throw new Error('Email is invalid');
  }

  email = email?.trim(); // just in case

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
      email: email || null
    }
  });

  if (updatedUser.email && original.email !== updatedUser.email) {
    const isVerified = original.emailVerifications.some((v) => v.email === email && v.completedAt);
    if (!isVerified) {
      await sendVerificationEmail({ userId });
    }
    return { success: true, verificationEmailSent: !isVerified };
  }

  return { success: true };
}
