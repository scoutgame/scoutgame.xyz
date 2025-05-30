'use server';

import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { authSecret } from '@packages/utils/constants';
import { unsealData } from 'iron-session';
import { cookies } from 'next/headers';

import { setupBuilderProfile } from './setupBuilderProfile';
import { setupBuilderProfileSchema } from './setupBuilderProfileSchema';

export const setupBuilderProfileAction = authActionClient
  .metadata({ actionName: 'setup_builder_profile' })
  .schema(setupBuilderProfileSchema)
  .action(async ({ parsedInput }) => {
    const cookieStore = await cookies();
    const inviteCodeCookie = cookieStore.get('invite-code');
    let inviteCode: string | null = null;
    if (inviteCodeCookie) {
      try {
        const inviteCodeData = (await unsealData(inviteCodeCookie.value, {
          password: authSecret as string
        })) as {
          inviteCode: string;
        };
        inviteCode = inviteCodeData.inviteCode;
      } catch (error) {
        //
      }
    }

    const { code, state } = parsedInput;
    const builder = await setupBuilderProfile({ code, state });

    trackUserAction('connect_github_success', {
      userId: builder.id
    });

    if (inviteCode) {
      cookieStore.set('invite-code', '', {
        maxAge: 0
      });
    }
  });
