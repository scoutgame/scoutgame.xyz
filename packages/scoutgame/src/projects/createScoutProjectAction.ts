'use server';

import { log } from '@charmverse/core/log';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { baseUrl } from '@packages/utils/constants';
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

    // Find all the project members except the creator
    const projectMemberUserIds = createdScoutProject.members
      .map((member) => member.userId)
      .filter((memberUserId) => memberUserId !== userId);

    for (const memberUserId of projectMemberUserIds) {
      const member = createdScoutProject.members.find((_member) => _member.userId === memberUserId);
      if (member) {
        try {
          await sendEmailTemplate({
            userId: memberUserId,
            senderAddress: 'The Scout Game <updates@mail.scoutgame.xyz>',
            subject: 'You have been added to a project! 🎉',
            templateType: 'added_to_project',
            templateVariables: {
              builder_name: member.user.displayName,
              project_name: createdScoutProject.name,
              project_link: `${baseUrl}/p/${createdScoutProject.path}`
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

    return createdScoutProject;
  });
