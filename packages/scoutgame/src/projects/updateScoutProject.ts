import { prisma, ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { getContractDeployerAddress } from '@packages/blockchain/getContractDeployerAddress';
import { v4 } from 'uuid';
import type { Transaction } from 'viem';
import { verifyMessage } from 'viem';

import { CONTRACT_DEPLOYER_SIGN_MESSAGE } from './constants';
import type { UpdateScoutProjectFormValues } from './updateScoutProjectSchema';

export async function updateScoutProject(payload: UpdateScoutProjectFormValues, userId: string) {
  const project = await prisma.scoutProject.findUniqueOrThrow({
    where: {
      id: payload.projectId
    },
    select: {
      scoutProjectMembers: {
        select: {
          userId: true
        }
      },
      scoutProjectDeployers: {
        select: {
          address: true
        }
      },
      scoutProjectContracts: {
        select: {
          address: true
        }
      }
    }
  });

  const contractRecord: Record<string, { tx: Transaction; chainId: number }> = {};
  const projectMemberIds = project.scoutProjectMembers.map((member) => member.userId);
  const projectDeployerAddresses = project.scoutProjectDeployers.map((deployer) => deployer.address);
  const projectContractAddresses = project.scoutProjectContracts.map((contract) => contract.address);

  const addedContractAddresses =
    payload.contracts
      ?.map((contract) => contract.address)
      .filter((address) => !projectContractAddresses.includes(address)) ?? [];
  const addedDeployerAddresses =
    payload.deployers
      ?.map((deployer) => deployer.address)
      .filter((address) => !projectDeployerAddresses.includes(address)) ?? [];
  const addedProjectMemberIds =
    payload.teamMembers?.map((member) => member.scoutId).filter((scoutId) => !projectMemberIds.includes(scoutId)) ?? [];

  const removedContractAddresses =
    payload.contracts &&
    projectContractAddresses.filter((address) => payload.contracts!.some((contract) => contract.address === address));
  const removedDeployerAddresses =
    payload.deployers &&
    projectDeployerAddresses.filter((address) => payload.deployers!.some((deployer) => deployer.address === address));
  const removedProjectMemberIds =
    payload.teamMembers &&
    projectMemberIds.filter((scoutId) => payload.teamMembers!.some((member) => member.scoutId === scoutId));

  if (payload.deployers && addedDeployerAddresses.length > 0) {
    for (const deployerAddress of addedDeployerAddresses) {
      const deployer = payload.deployers.find((_deployer) => _deployer.address === deployerAddress);
      if (deployer) {
        const isValidSignature = await verifyMessage({
          message: CONTRACT_DEPLOYER_SIGN_MESSAGE,
          signature: deployer.signature as `0x${string}`,
          address: deployer.address as `0x${string}`
        });
        if (!isValidSignature) {
          throw new Error(`Invalid signature for deployer ${deployer.address}`);
        }
      }
    }
  }

  if (payload.contracts && addedContractAddresses.length > 0) {
    for (const contractAddress of addedContractAddresses) {
      const contract = payload.contracts.find((_contract) => _contract.address === contractAddress);
      if (contract) {
        const transaction = await getContractDeployerAddress({
          contractAddress: contract.address,
          chainId: contract.chainId
        });
        contractRecord[contract.address] = {
          tx: transaction,
          chainId: contract.chainId
        };
        if (transaction.from.toLowerCase() !== contract.deployerAddress.toLowerCase()) {
          throw new Error(
            `Contract ${contract.address} was not deployed by the provided deployer. Actual deployer: ${transaction.from}`
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

    if (removedContractAddresses && removedContractAddresses.length > 0) {
      await tx.scoutProjectContract.updateMany({
        where: {
          address: {
            in: removedContractAddresses
          },
          projectId: _updatedProject.id
        },
        data: {
          deletedAt: new Date()
        }
      });
    }

    if (removedDeployerAddresses && removedDeployerAddresses.length > 0) {
      await tx.scoutProjectDeployer.deleteMany({
        where: {
          address: {
            in: removedDeployerAddresses
          },
          projectId: _updatedProject.id
        }
      });
    }

    if (removedProjectMemberIds && removedProjectMemberIds.length > 0) {
      await tx.scoutProjectMember.updateMany({
        where: {
          userId: {
            in: removedProjectMemberIds
          },
          projectId: _updatedProject.id
        },
        data: {
          deletedAt: new Date()
        }
      });
    }

    if (addedProjectMemberIds && addedProjectMemberIds.length > 0) {
      await tx.scoutProjectMember.createMany({
        data: addedProjectMemberIds.map((scoutId) => ({
          userId: scoutId,
          projectId: _updatedProject.id,
          role: ScoutProjectMemberRole.member,
          createdBy: userId
        }))
      });
    }

    const addedDeployerRecord: Record<string, string> = {};

    if (addedDeployerAddresses.length > 0) {
      await tx.scoutProjectDeployer.createMany({
        data: addedDeployerAddresses.map((address) => {
          const deployerId = v4();
          addedDeployerRecord[address] = deployerId;
          return {
            id: deployerId,
            address,
            projectId: _updatedProject.id,
            createdBy: userId
          };
        })
      });
    }

    if (addedContractAddresses.length > 0) {
      await tx.scoutProjectContract.createMany({
        data: addedContractAddresses.map((address) => ({
          createdBy: userId,
          projectId: _updatedProject.id,
          address,
          chainId: contractRecord[address].chainId,
          // TODO: get accurate deployed at
          deployedAt: new Date(),
          deployTxHash: contractRecord[address].tx.hash,
          blockNumber: Number(contractRecord[address].tx.blockNumber),
          deployerId: addedDeployerRecord[address]
        }))
      });
    }

    return _updatedProject;
  });

  return updatedProject;
}
