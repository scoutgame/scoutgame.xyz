import { prisma } from '@charmverse/core/prisma-client';
import { mockBuilder, mockScoutProject } from '@packages/testing/database';

import { leaveProject } from '../leaveProject';

describe('leaveProject', () => {
  it('should throw an error if the user is the owner', async () => {
    const builder = await mockBuilder();
    const project = await mockScoutProject({ userId: builder.id });

    await expect(leaveProject({ projectId: project.id, userId: builder.id })).rejects.toThrow(
      'Cannot leave project as owner'
    );
  });

  it('should leave a project', async () => {
    const builder = await mockBuilder();
    const member = await mockBuilder();
    const project = await mockScoutProject({ userId: builder.id, memberIds: [member.id] });

    await leaveProject({ projectId: project.id, userId: member.id });

    const projectMember = await prisma.scoutProjectMember.findUniqueOrThrow({
      where: {
        projectId_userId: { projectId: project.id, userId: member.id }
      },
      select: {
        deletedAt: true
      }
    });

    expect(projectMember.deletedAt).not.toBeNull();
  });
});
