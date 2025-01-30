import { prisma } from '@charmverse/core/prisma-client';

export async function leaveProject({ projectId, userId }: { projectId: string; userId: string }) {
  const projectMember = await prisma.scoutProjectMember.findUniqueOrThrow({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    },
    select: {
      role: true
    }
  });

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
