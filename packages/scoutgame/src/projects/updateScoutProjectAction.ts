'use server';

import { prisma, ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
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
    const projectMember = await prisma.scoutProjectMember.findFirst({
      where: {
        userId,
        projectId: parsedInput.projectId,
        role: ScoutProjectMemberRole.owner
      }
    });

    if (!projectMember) {
      throw new Error('You are not authorized to update this project');
    }

    const updatedProject = await updateScoutProject(parsedInput, userId);
    revalidatePath('/projects');

    return updatedProject;
  });
