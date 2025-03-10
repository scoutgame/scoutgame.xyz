import { prisma } from '@charmverse/core/prisma-client';
import type { ScoutProject, Prisma } from '@charmverse/core/prisma-client';

const projectMinimalSelect = {
  id: true,
  name: true,
  avatar: true,
  path: true
} satisfies Prisma.ScoutProjectSelect;

export type ScoutProjectMinimal = Pick<ScoutProject, 'id' | 'path' | 'avatar' | 'name'>;

export async function getUserScoutProjectsInfo({ userId }: { userId: string }): Promise<ScoutProjectMinimal[]> {
  const projects = await prisma.scoutProject.findMany({
    where: {
      members: {
        some: {
          userId,
          deletedAt: null
        }
      },
      deletedAt: null
    },
    select: projectMinimalSelect
  });
  return projects;
}
