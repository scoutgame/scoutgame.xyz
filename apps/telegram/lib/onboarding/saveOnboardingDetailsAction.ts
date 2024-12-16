'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { registerLoopsContact } from '@packages/loops/registerLoopsContact';
import { getPlatform } from '@packages/mixpanel/utils';
import { authActionClient } from '@packages/scoutgame/actions/actionClient';

import { saveOnboardingDetailsSchema } from './saveOnboardingDetailsSchema';

export const saveOnboardingDetailsAction = authActionClient
  .metadata({ actionName: 'save-onboarding-details' })
  .schema(saveOnboardingDetailsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;
    if (!parsedInput.agreedToTOS) {
      throw new Error('You need to accept the terms and conditions.');
    }

    await prisma.scout.update({
      where: { id: userId },
      data: {
        email: parsedInput.email,
        sendMarketing: parsedInput.sendMarketing,
        agreedToTermsAt: new Date(),
        onboardedAt: new Date()
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
