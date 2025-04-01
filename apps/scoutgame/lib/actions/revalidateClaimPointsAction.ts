'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';

export const revalidateClaimPointsAction = authActionClient
  .metadata({ actionName: 'revalidate_claim_points' })
  .action<void>(async () => {
    revalidatePath('/profile');
    revalidatePath('/claim');
  });
