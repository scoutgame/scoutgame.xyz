'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';

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

    const path =
      existingUser.displayName === parsedInput.displayName
        ? undefined
        : await generateUserPath(parsedInput.displayName);

    await prisma.scout.update({
      where: { id: userId },
      data: {
        sendMarketing: parsedInput.sendMarketing,
        agreedToTermsAt: new Date(),
        onboardedAt: new Date(),
        avatar: parsedInput.avatar,
        displayName: parsedInput.displayName,
        path,
        bio: parsedInput.bio
      }
    });

    return { success: true };
  });
