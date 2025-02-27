import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { completeQuests } from '@packages/scoutgame/quests/completeQuests';
import { baseUrl } from '@packages/utils/constants';

import { updateReferralUsers } from './referrals/updateReferralUsers';

export class InvalidVerificationError extends Error {
  constructor() {
    super('Invalid or expired verification code');
  }
}

export async function sendVerificationEmail({ userId }: { userId: string }) {
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      email: true
    }
  });

  if (!scout.email) {
    throw new Error('User has no email');
  }

  const code = await createVerificationCode({ email: scout.email, userId });

  // Send verification email
  await sendEmailTemplate({
    userId,
    senderAddress: `The Scout Game <noreply@mail.scoutgame.xyz>`,
    subject: 'Verify your email',
    templateType: 'email_verification',
    templateVariables: {
      verification_url: `${baseUrl}/verify-email?code=${code}`
    },
    overrideUserSendingPreference: true
  });

  log.info('Verification email sent', { userId });

  return code;
}

export async function createVerificationCode({ email, userId }: { email: string; userId: string }) {
  // Generate a 18-digit verification code
  const code = Math.floor(100000000000000000 + Math.random() * 900000000000000000).toString();

  await prisma.scoutEmailVerification.create({
    data: {
      code,
      email,
      scoutId: userId
      // completedAt will be null until verified
    }
  });
  return code;
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

  await completeQuests(verification.scoutId, ['verify-email']);

  trackUserAction('verify_email', {
    userId: verification.scoutId
  });

  // check if we should count a referral
  try {
    await updateReferralUsers(verification.scoutId);
  } catch (error) {
    log.error('Error updating user referrals after email verification ', { userId: verification.scoutId, error });
  }

  return { result: 'verified' };
}
