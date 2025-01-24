import { prisma } from '@charmverse/core/prisma-client';

import type { CreateScoutProjectFormValues } from './createScoutProjectSchema';

export async function createScoutProject(payload: CreateScoutProjectFormValues, userId: string) {
  return prisma.scoutProject.create({
    data: {
      name: payload.name,
      avatar: payload.avatar,
      description: payload.description,
      website: payload.website,
      github: payload.github,
      scoutProjectMembers: {
        create: {
          createdBy: userId,
          role: 'owner',
          userId
        }
      }
    }
  });
}
