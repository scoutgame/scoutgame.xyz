import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/config';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';

import { updateReferralUsers } from './referrals/updateReferralUsers';

export class InvalidVerificationError extends Error {
  constructor() {
    super('Invalid or expired verification code');
  }
}

export async function createEmailVerification({ userId }: { userId: string }) {
  // Generate a 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      email: true
    }
  });

  await prisma.scoutEmailVerification.create({
    data: {
      code,
      email: scout.email,
      scoutId: userId
      // completedAt will be null until verified
    }
  });

  // Send verification email
  await sendEmailTemplate({
    userId,
    senderAddress: `The Scout Game <noreply@mail.scoutgame.xyz>`,
    subject: 'Verify your email',
    template: 'email verification',
    templateVariables: {
      verification_url: `${baseUrl}/verify-email?code=${code}`
    }
  });
}

export async function verifyEmail(code: string): Promise<{ result: 'already_verified' | 'verified' }> {
  const verification = await prisma.scoutEmailVerification.findFirst({
    where: {
      code
    }
  });

  if (!verification) {
    throw new InvalidVerificationError();
  }
  if (verification.completedAt) {
    return { result: 'already_verified' };
  }

  // Update verification as completed
  await prisma.scoutEmailVerification.update({
    where: {
      code: verification.code
    },
    data: {
      completedAt: new Date()
    }
  });

  // check if we should count a referral
  await updateReferralUsers(verification.userId);

  return { result: 'verified' };
}
