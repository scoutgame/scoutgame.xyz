'use server';

import { revalidatePath } from 'next/cache';

import { actionClient } from './actionClient';

/**
 * Revalidates the main layout data.
 */
export const revalidateNewsPathAction = actionClient
  .metadata({ actionName: 'revalidateNewsPath' })
  .action<void>(async () => {
    revalidatePath('/news');
  });
