'use server';

import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';

import { createScoutProject } from './createScoutProject';
import { createScoutProjectSchema } from './createScoutProjectSchema';

export const createScoutProjectAction = authActionClient
  .metadata({
    actionName: 'create-scout-project'
  })
  .schema(createScoutProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;

    const createdScoutProject = await createScoutProject(parsedInput, userId);
    trackUserAction('create_project', {
      name: createdScoutProject.name,
      path: createdScoutProject.path,
      userId
    });
    revalidatePath('/projects');

    return createdScoutProject;
  });
