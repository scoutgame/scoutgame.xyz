import { prisma, ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { getContractDeployerAddress } from '@packages/blockchain/getContractDeployerAddress';
import { isTruthy } from '@packages/utils/types';
import { verifyMessage } from 'viem';

import { CONTRACT_DEPLOYER_SIGN_MESSAGE } from './constants';
import type { UpdateScoutProjectFormValues } from './updateScoutProjectSchema';

export async function updateScoutProject(payload: UpdateScoutProjectFormValues, userId: string) {
  const projectMember = await prisma.scoutProjectMember.findFirst({
    where: {
      userId,
      projectId: payload.projectId,
      role: ScoutProjectMemberRole.owner
    }
  });

  if (!projectMember) {
    throw new Error('You are not authorized to update this project');
  }

  const totalOwner = payload.teamMembers?.filter((member) => member.role === 'owner').length ?? 0;

  if (totalOwner > 1) {
    throw new Error('Project can only have one owner');
  }

  if (totalOwner === 0) {
    throw new Error('Project must have at least one owner');
  }

  const project = await prisma.scoutProject.findUniqueOrThrow({
    where: {
      id: payload.projectId
    },
    select: {
      members: {
        select: {
          userId: true,
          deletedAt: true
        }
      },
      deployers: {
        select: {
          address: true
        }
      },
      contracts: {
        select: {
          address: true,
          deletedAt: true
        }
      }
    }
  });

  const contractTransactionRecord: Record<
    string,
    { chainId: number; txHash: string; blockNumber: number; blockTimestamp: number; deployerAddress: string }
  > = {};
  const projectMemberIds = project.members.map((member) => member.userId);
  const projectDeployerAddresses = project.deployers.map((deployer) => deployer.address.toLowerCase());
  const projectContractAddresses = project.contracts.map((contract) => contract.address.toLowerCase());
  const payloadProjectMemberIds = payload.teamMembers.map((member) => member.scoutId);
  const payloadProjectDeployerAddresses = payload.deployers.map((deployer) => deployer.address.toLowerCase());
  const payloadProjectContractAddresses = payload.contracts.map((contract) => contract.address.toLowerCase());

  const contractAddressesToCreate = payloadProjectContractAddresses.filter(
    (address) => !projectContractAddresses.includes(address)
  );
  const contractAddressesToRemove = projectContractAddresses.filter(
    (address) => !payloadProjectContractAddresses.includes(address)
  );

  const deployerAddressesToCreate = payloadProjectDeployerAddresses.filter(
    (address) => !projectDeployerAddresses.includes(address)
  );

  const projectMemberIdsToCreate = payloadProjectMemberIds.filter((scoutId) => !projectMemberIds.includes(scoutId));

  const projectMemberIdsToRemove = projectMemberIds.filter((scoutId) => !payloadProjectMemberIds.includes(scoutId));

  const deletedProjectMemberIds = project.members.filter((member) => member.deletedAt).map((member) => member.userId);

  const deletedContractAddresses = project.contracts
    .filter((contract) => contract.deletedAt)
    .map((contract) => contract.address.toLowerCase());

  const projectMemberIdsToRestore = deletedProjectMemberIds.filter((scoutId) =>
    payloadProjectMemberIds.includes(scoutId)
  );

  const contractAddressesToRestore = deletedContractAddresses.filter((address) =>
    payloadProjectContractAddresses.includes(address)
  );

  const retainedProjectMemberIds = projectMemberIds.filter((scoutId) => payloadProjectMemberIds.includes(scoutId));

  const builderMemberIds = [...retainedProjectMemberIds, ...projectMemberIdsToRestore, ...projectMemberIdsToCreate];

  const builderMembersCount = await prisma.scout.count({
    where: {
      builderStatus: 'approved',
      id: {
        in: builderMemberIds
      }
    }
  });

  if (builderMembersCount !== builderMemberIds.length) {
    throw new Error('All project members must be builders');
  }

  if (deployerAddressesToCreate.length) {
    for (const deployerAddress of deployerAddressesToCreate) {
      const deployer = payload.deployers.find(
        (_deployer) => _deployer.address.toLowerCase() === deployerAddress.toLowerCase()
      );
      if (deployer) {
        const isValidSignature = await verifyMessage({
          message: CONTRACT_DEPLOYER_SIGN_MESSAGE,
          signature: deployer.signature as `0x${string}`,
          address: deployer.address.toLowerCase() as `0x${string}`
        });
        if (!isValidSignature) {
          throw new Error(`Invalid signature for deployer ${deployer.address}`);
        }
      }
    }
  }

  if (contractAddressesToCreate.length) {
    for (const contractAddress of contractAddressesToCreate) {
      const contract = payload.contracts.find(
        (_contract) => _contract.address.toLowerCase() === contractAddress.toLowerCase()
      );
      if (contract) {
        const { transaction, block } = await getContractDeployerAddress({
          contractAddress: contract.address.toLowerCase(),
          chainId: contract.chainId
        });
        contractTransactionRecord[contract.address.toLowerCase()] = {
          chainId: contract.chainId,
          txHash: transaction.hash,
          blockNumber: Number(block.number),
          blockTimestamp: Number(block.timestamp),
          deployerAddress: transaction.from.toLowerCase()
        };
        if (contract.deployerAddress.toLowerCase() !== transaction.from.toLowerCase()) {
          throw new Error(
            `Contract ${contract.address.toLowerCase()} was not deployed by the provided deployer. Actual deployer: ${transaction.from.toLowerCase()}`
          );
        }
      }
    }
  }

  const updatedProject = await prisma.$transaction(async (tx) => {
    const _updatedProject = await tx.scoutProject.update({
      where: {
        id: payload.projectId
      },
      data: {
        name: payload.name ?? undefined,
        avatar: payload.avatar ?? undefined,
        description: payload.description ?? undefined,
        website: payload.website ?? undefined,
        github: payload.github ?? undefined
      }
    });

    if (contractAddressesToRemove.length) {
      await tx.scoutProjectContract.updateMany({
        where: {
          address: {
            in: contractAddressesToRemove
          },
          projectId: _updatedProject.id
        },
        data: {
          deletedAt: new Date()
        }
      });
    }

    if (projectMemberIdsToRemove.length) {
      await tx.scoutProjectMember.updateMany({
        where: {
          userId: {
            in: projectMemberIdsToRemove
          },
          projectId: _updatedProject.id
        },
        data: {
          deletedAt: new Date()
        }
      });
    }

    if (projectMemberIdsToRestore.length) {
      await tx.scoutProjectMember.updateMany({
        where: {
          userId: {
            in: projectMemberIdsToRestore
          },
          projectId: _updatedProject.id
        },
        data: {
          deletedAt: null
        }
      });
    }

    if (contractAddressesToRestore.length) {
      await tx.scoutProjectContract.updateMany({
        where: {
          address: {
            in: contractAddressesToRestore
          },
          projectId: _updatedProject.id
        },
        data: {
          deletedAt: null
        }
      });
    }

    if (projectMemberIdsToCreate.length) {
      await tx.scoutProjectMember.createMany({
        data: projectMemberIdsToCreate
          .map((scoutId) => payload.teamMembers.find((member) => member.scoutId === scoutId))
          .filter(isTruthy)
          .map((member) => ({
            userId: member.scoutId,
            projectId: _updatedProject.id,
            role: member.role as ScoutProjectMemberRole,
            createdBy: userId
          }))
      });
    }

    if (deployerAddressesToCreate.length) {
      await tx.scoutProjectDeployer.createMany({
        data: deployerAddressesToCreate.map((address) => ({
          address: address.toLowerCase(),
          projectId: _updatedProject.id,
          verifiedBy: userId,
          verifiedAt: new Date()
        }))
      });
    }

    const deployers = await tx.scoutProjectDeployer.findMany({
      where: {
        projectId: _updatedProject.id
      },
      select: {
        id: true,
        address: true
      }
    });

    if (retainedProjectMemberIds.length) {
      await Promise.all(
        retainedProjectMemberIds
          .map((scoutId) => payload.teamMembers.find((member) => member.scoutId === scoutId))
          .filter(isTruthy)
          .map((member) =>
            tx.scoutProjectMember.update({
              where: {
                projectId_userId: {
                  projectId: _updatedProject.id,
                  userId: member.scoutId
                }
              },
              data: {
                role: member.role as ScoutProjectMemberRole
              }
            })
          )
      );
    }

    if (contractAddressesToCreate.length) {
      await tx.scoutProjectContract.createMany({
        data: contractAddressesToCreate.map((address) => ({
          createdBy: userId,
          projectId: _updatedProject.id,
          address: address.toLowerCase(),
          chainId: contractTransactionRecord[address].chainId,
          deployedAt: new Date(contractTransactionRecord[address].blockTimestamp * 1000),
          deployTxHash: contractTransactionRecord[address].txHash,
          blockNumber: contractTransactionRecord[address].blockNumber,
          deployerId: deployers.find(
            (deployer) => deployer.address === contractTransactionRecord[address].deployerAddress
          )!.id
        }))
      });
    }

    return _updatedProject;
  });

  return updatedProject;
}
