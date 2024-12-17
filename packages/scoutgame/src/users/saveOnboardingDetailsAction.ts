'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { registerLoopsContact } from '@packages/loops/registerLoopsContact';
import { getPlatform } from '@packages/mixpanel/utils';

import { authActionClient } from '../actions/actionClient';

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

    if (!parsedInput.agreedToTOS) {
      throw new Error('You need to accept the terms and conditions.');
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
    if (parsedInput.email) {
      await registerLoopsContact(
        {
          email: parsedInput.email,
          displayName: parsedInput.displayName,
          sendMarketing: !!parsedInput.sendMarketing,
          createdAt: existingUser.createdAt
        },
        getPlatform()
      );
    }

    return { success: true };
  });
