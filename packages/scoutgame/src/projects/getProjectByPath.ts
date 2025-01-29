import { prisma } from '@charmverse/core/prisma-client';

import type { ScoutProjectDetailed } from './getUserScoutProjects';
import { projectDetailedSelect } from './projectSelect';

export async function getProjectByPath(path: string): Promise<ScoutProjectDetailed | null> {
  const scoutProject = await prisma.scoutProject.findUnique({
    where: {
      path
    },
    select: projectDetailedSelect
  });

  if (!scoutProject) {
    return null;
  }

  return {
    ...scoutProject,
    contracts: scoutProject.scoutProjectContracts,
    deployers: scoutProject.scoutProjectDeployers,
    teamMembers: scoutProject.scoutProjectMembers.map((member) => ({
      id: member.user.id,
      avatar: member.user.avatar ?? '',
      displayName: member.user.displayName,
      role: member.role,
      path: member.user.path
    }))
  };
}
