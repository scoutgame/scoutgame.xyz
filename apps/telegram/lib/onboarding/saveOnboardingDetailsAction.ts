'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { registerScout as registerBeehiiv } from '@packages/beehiiv/registerScout';
import { registerScout as registerLoops } from '@packages/loops/registerScout';
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

    const scout = await prisma.scout.update({
      where: { id: userId },
      data: {
        email: parsedInput.email,
        sendMarketing: parsedInput.sendMarketing,
        agreedToTermsAt: new Date(),
        onboardedAt: new Date()
      }
    });
    if (parsedInput.email) {
      await registerLoops(
        {
          email: parsedInput.email,
          displayName: scout.displayName,
          sendMarketing: !!parsedInput.sendMarketing,
          createdAt: scout.createdAt
        },
        getPlatform()
      );
      await registerBeehiiv({
        email: parsedInput.email,
        sendMarketing: !!parsedInput.sendMarketing
      });
    }

    return { success: true };
  });
