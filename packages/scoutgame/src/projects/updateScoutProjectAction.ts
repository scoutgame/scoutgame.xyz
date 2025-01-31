'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';

import { updateScoutProject } from './updateScoutProject';
import { updateScoutProjectSchema } from './updateScoutProjectSchema';

export const updateScoutProjectAction = authActionClient
  .metadata({
    actionName: 'update-scout-project'
  })
  .schema(updateScoutProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;
    const updatedProject = await updateScoutProject(parsedInput, userId);
    revalidatePath('/projects');

    return updatedProject;
  });
