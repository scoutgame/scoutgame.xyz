import { prisma } from '@charmverse/core/prisma-client';

export async function leaveProject({ projectId, userId }: { projectId: string; userId: string }) {
  const project = await prisma.scoutProject.findUniqueOrThrow({
    where: {
      id: projectId
    },
    select: {
      scoutProjectMembers: {
        where: {
          userId
        },
        select: {
          role: true
        }
      }
    }
  });

  const projectMember = project.scoutProjectMembers[0];

  if (projectMember.role === 'owner') {
    throw new Error('Cannot leave project as owner');
  }

  await prisma.scoutProjectMember.update({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    },
    data: {
      deletedAt: new Date()
    }
  });
}
