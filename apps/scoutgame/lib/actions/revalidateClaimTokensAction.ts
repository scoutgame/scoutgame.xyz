'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';

export const revalidateClaimTokensAction = authActionClient
  .metadata({ actionName: 'revalidate_claim_tokens' })
  .action<void>(async () => {
    revalidatePath('/profile');
    revalidatePath('/claim');
  });
