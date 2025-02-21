'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { registerScout as registerBeehiiv } from '@packages/beehiiv/registerScout';
import { registerScout as registerLoops } from '@packages/loops/registerScout';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { sendVerificationEmail } from '@packages/users/verifyEmail';
import { getPlatform } from '@packages/utils/platform';
import { isValidEmail } from '@packages/utils/strings';

import { generateUserPath } from './generateUserPath';
import { saveOnboardingDetailsSchema } from './saveOnboardingDetailsSchema';

export const saveOnboardingDetailsAction = authActionClient
  .metadata({ actionName: 'save-onboarding-details' })
  .schema(saveOnboardingDetailsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;
    const existingUser = await prisma.scout.findUniqueOrThrow({
      where: { id: userId },
      select: {
        createdAt: true,
        displayName: true
      }
    });

    if (!isValidEmail(parsedInput.email)) {
      throw new Error('Email is invalid');
    }

    const path =
      existingUser.displayName === parsedInput.displayName
        ? undefined
        : await generateUserPath(parsedInput.displayName);

    await prisma.scout.update({
      where: { id: userId },
      data: {
        email: parsedInput.email,
        sendMarketing: parsedInput.sendMarketing,
        agreedToTermsAt: new Date(),
        onboardedAt: new Date(),
        avatar: parsedInput.avatar,
        displayName: parsedInput.displayName,
        path,
        bio: parsedInput.bio
      }
    });

    if (parsedInput.sendMarketing) {
      await registerLoops(
        {
          email: parsedInput.email,
          displayName: parsedInput.displayName,
          sendMarketing: !!parsedInput.sendMarketing,
          createdAt: existingUser.createdAt
        },
        getPlatform()
      );
      await registerBeehiiv({
        email: parsedInput.email,
        sendMarketing: !!parsedInput.sendMarketing
      });
    }

    try {
      // user must verify email before referral can be counted
      await sendVerificationEmail({ userId });
    } catch (error) {
      log.error('Error sending verification email', { error, userId });
    }

    return { success: true };
  });
