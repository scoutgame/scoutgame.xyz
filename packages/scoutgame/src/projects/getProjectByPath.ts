import { prisma } from '@charmverse/core/prisma-client';

export async function getProjectByPath(path: string) {
  return prisma.scoutProject.findUnique({
    where: {
      path
    }
  });
}
