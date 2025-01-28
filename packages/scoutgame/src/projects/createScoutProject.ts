import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { CreateScoutProjectFormValues } from './createScoutProjectSchema';
import { generateProjectPath } from './generateProjectPath';

export async function createScoutProject(payload: CreateScoutProjectFormValues, userId: string) {
  const path = await generateProjectPath(payload.name);

  const project = await prisma.$transaction(async (tx) => {
    const scoutProject = await tx.scoutProject.create({
      data: {
        name: payload.name,
        avatar: payload.avatar,
        description: payload.description,
        website: payload.website,
        github: payload.github,
        path,
        scoutProjectDeployers:
          payload.deployers && payload.deployers.length
            ? {
                createMany: {
                  data: payload.deployers.map((deployer) => ({
                    address: deployer.address,
                    verifiedAt: deployer.verifiedAt,
                    verifiedBy: userId
                  }))
                }
              }
            : undefined,
        scoutProjectMembers: {
          createMany: {
            data: payload.teamMembers.map((member) => ({
              userId: member.scoutId,
              createdBy: userId,
              role: member.role as ScoutProjectMemberRole
            }))
          }
        }
      },
      select: {
        id: true,
        scoutProjectDeployers: true
      }
    });

    const scoutProjectDeployers = scoutProject.scoutProjectDeployers;

    if (payload.contracts && payload.contracts.length) {
      await tx.scoutProjectContract.createMany({
        data: payload.contracts
          .map((contract) => {
            const deployer = scoutProjectDeployers.find((d) => d.address === contract.address);
            if (!deployer) {
              return null;
            }
            return {
              scoutProjectId: scoutProject.id,
              address: contract.address,
              chainId: contract.chainId,
              createdBy: userId,
              deployedAt: new Date(),
              projectId: scoutProject.id,
              deployerId: deployer?.id,
              deployTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
              blockNumber: 0
            };
          })
          .filter((contract) => contract !== null)
      });
    }

    return scoutProject;
  });

  return project;
}
