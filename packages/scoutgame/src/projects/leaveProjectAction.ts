'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';

import { leaveProject } from './leaveProject';
import { leaveProjectSchema } from './leaveProjectSchema';

export const leaveProjectAction = authActionClient
  .metadata({
    actionName: 'leave-project'
  })
  .schema(leaveProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;
    const createdScoutProject = await leaveProject({
      projectId: parsedInput.projectId,
      userId
    });
    revalidatePath('/profile/projects');

    return createdScoutProject;
  });
