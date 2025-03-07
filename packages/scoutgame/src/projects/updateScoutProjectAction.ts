'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { baseUrl } from '@packages/utils/constants';
import { revalidatePath } from 'next/cache';

import { sendNotifications } from '../notifications/sendNotifications';

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
        await sendNotifications({
          userId: member.userId,
          notificationType: 'added_to_project',
          email: {
            templateVariables: {
              builder_name: user.displayName,
              project_name: updatedProject.name,
              project_link: `${baseUrl}/p/${updatedProject.path}`
            }
          },
          farcaster: {
            templateVariables: {
              projectName: updatedProject.name,
              projectPath: updatedProject.path
            }
          }
        });
      } catch (error) {
        log.error('Error sending added to project email', { error, userId });
      }
    }

    return updatedProject;
  });
