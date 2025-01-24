import { prisma } from '@charmverse/core/prisma-client';

export type UserScoutProject = {
  id: string;
  avatar: string;
  name: string;
  description: string;
  website: string;
  github: string;
};

export async function getUserScoutProjects({ userId }: { userId: string }): Promise<UserScoutProject[]> {
  return prisma.scoutProject.findMany({
    where: {
      scoutProjectMembers: {
        some: {
          userId
        }
      },
      deletedAt: null
    }
  });
}
