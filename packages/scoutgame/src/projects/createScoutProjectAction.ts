'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';

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

    return createdScoutProject;
  });
