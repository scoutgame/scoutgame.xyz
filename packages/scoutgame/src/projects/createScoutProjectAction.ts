'use server';

import { log } from '@charmverse/core/log';
import { sendDiscordEvent } from '@packages/discord/sendDiscordEvent';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';

import { sendNotifications } from '../notifications/sendNotifications';

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

    // Find all the project members except the creator
    const projectMemberUserIds = createdScoutProject.members
      .map((member) => member.userId)
      .filter((memberUserId) => memberUserId !== userId);

    for (const memberUserId of projectMemberUserIds) {
      const member = createdScoutProject.members.find((_member) => _member.userId === memberUserId);
      if (member) {
        try {
          await sendNotifications({
            userId: memberUserId,
            notificationType: 'added_to_project',
            email: {
              templateVariables: {
                builder_name: member.user.displayName,
                project_name: createdScoutProject.name,
                project_link: `https://scoutgame.xyz/p/${createdScoutProject.path}`
              }
            },
            farcaster: {
              templateVariables: {
                projectName: createdScoutProject.name,
                projectPath: createdScoutProject.path
              }
            },
            app: {
              templateVariables: {
                projectName: createdScoutProject.name,
                projectPath: createdScoutProject.path
              }
            }
          });
        } catch (error) {
          log.error('Error sending added to project email', { error, userId });
        }
      }
    }

    trackUserAction('create_project', {
      name: createdScoutProject.name,
      path: createdScoutProject.path,
      userId
    });
    revalidatePath('/profile/projects');

    const creator = createdScoutProject.members.find((member) => member.userId === userId);

    await sendDiscordEvent({
      title: '🎉 Project Created',
      description: `Project ${createdScoutProject.name} has been created`,
      fields: [
        { name: 'Project', value: `https://scoutgame.xyz/p/${createdScoutProject.path}` },
        { name: 'Creator', value: `https://scoutgame.xyz/u/${creator?.user.path}` }
      ]
    });

    return createdScoutProject;
  });
