import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
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
        createMany: {
          data: payload.teamMembers.map((member) => ({
            userId: member.scoutId,
            createdBy: userId,
            role: member.role as ScoutProjectMemberRole
          }))
        }
      }
    }
  });
}
