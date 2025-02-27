'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { baseUrl } from '@packages/utils/constants';
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
    const existingProjectMembers = await prisma.scoutProjectMember.findMany({
      where: {
        userId,
        projectId: parsedInput.projectId
      },
      select: {
        userId: true
      }
    });

    const updatedProject = await updateScoutProject(parsedInput, userId);
    revalidatePath('/profile/projects');

    const newProjectMembers = await prisma.scoutProjectMember.findMany({
      where: {
        projectId: parsedInput.projectId,
        userId: {
          notIn: existingProjectMembers.map((member) => member.userId)
        }
      },
      select: {
        userId: true,
        user: {
          select: {
            displayName: true
          }
        }
      }
    });
    for (const member of newProjectMembers) {
      const user = member.user;

      try {
        await sendEmailTemplate({
          userId: member.userId,
          senderAddress: 'The Scout Game <updates@mail.scoutgame.xyz>',
          subject: 'You have been added to a project! 🎉',
          templateType: 'added_to_project',
          templateVariables: {
            builder_name: user.displayName,
            project_name: updatedProject.name,
            project_link: `${baseUrl}/p/${updatedProject.path}`
          }
        });
      } catch (error) {
        log.error('Error sending added to project email', { error, userId });
      }
    }

    return updatedProject;
  });
