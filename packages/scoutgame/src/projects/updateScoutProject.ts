import { prisma, ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { getContractDeployerAddress } from '@packages/blockchain/getContractDeployerAddress';
import { v4 } from 'uuid';
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
          userId: true,
          deletedAt: true
        }
      },
      scoutProjectDeployers: {
        select: {
          address: true
        }
      },
      scoutProjectContracts: {
        select: {
          address: true,
          deletedAt: true
        }
      }
    }
  });

  const contractTransactionRecord: Record<
    string,
    { chainId: number; txHash: string; blockNumber: number; blockTimestamp: number }
  > = {};
  const projectMemberIds = project.scoutProjectMembers.map((member) => member.userId);
  const projectDeployerAddresses = project.scoutProjectDeployers.map((deployer) => deployer.address.toLowerCase());
  const projectContractAddresses = project.scoutProjectContracts.map((contract) => contract.address.toLowerCase());

  const addedContractAddresses =
    payload.contracts
      ?.map((contract) => contract.address.toLowerCase())
      .filter((address) => !projectContractAddresses.includes(address)) ?? [];
  const addedDeployerAddresses =
    payload.deployers
      ?.map((deployer) => deployer.address.toLowerCase())
      .filter((address) => !projectDeployerAddresses.includes(address)) ?? [];
  const addedProjectMemberIds =
    payload.teamMembers?.map((member) => member.scoutId).filter((scoutId) => !projectMemberIds.includes(scoutId)) ?? [];

  const removedContractAddresses =
    payload.contracts &&
    projectContractAddresses.filter(
      (address) => !payload.contracts!.some((contract) => contract.address.toLowerCase() === address.toLowerCase())
    );
  const removedDeployerAddresses =
    payload.deployers &&
    projectDeployerAddresses.filter(
      (address) => !payload.deployers!.some((deployer) => deployer.address.toLowerCase() === address.toLowerCase())
    );
  const removedProjectMemberIds =
    payload.teamMembers &&
    projectMemberIds.filter((scoutId) => !payload.teamMembers!.some((member) => member.scoutId === scoutId));

  const deletedProjectMemberIds = project.scoutProjectMembers
    .filter((member) => member.deletedAt)
    .map((member) => member.userId);
  const deletedContractAddresses = project.scoutProjectContracts
    .filter((contract) => contract.deletedAt)
    .map((contract) => contract.address.toLowerCase());

  const restoredProjectMemberIds = deletedProjectMemberIds.filter((scoutId) =>
    payload.teamMembers?.map((member) => member.scoutId).includes(scoutId)
  );
  const restoredContractAddresses = deletedContractAddresses.filter((address) =>
    payload.contracts?.map((contract) => contract.address.toLowerCase()).includes(address)
  );

  if (payload.deployers && addedDeployerAddresses.length > 0) {
    for (const deployerAddress of addedDeployerAddresses) {
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

  if (payload.contracts && addedContractAddresses.length > 0) {
    for (const contractAddress of addedContractAddresses) {
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
          blockTimestamp: Number(block.timestamp)
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

    if (restoredProjectMemberIds && restoredProjectMemberIds.length > 0) {
      await tx.scoutProjectMember.updateMany({
        where: {
          userId: {
            in: restoredProjectMemberIds
          },
          projectId: _updatedProject.id
        },
        data: {
          deletedAt: null
        }
      });
    }

    if (restoredContractAddresses && restoredContractAddresses.length > 0) {
      await tx.scoutProjectContract.updateMany({
        where: {
          address: {
            in: restoredContractAddresses
          },
          projectId: _updatedProject.id
        },
        data: {
          deletedAt: null
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
            address: address.toLowerCase(),
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
          address: address.toLowerCase(),
          chainId: contractTransactionRecord[address].chainId,
          deployedAt: new Date(contractTransactionRecord[address].blockTimestamp * 1000),
          deployTxHash: contractTransactionRecord[address].txHash,
          blockNumber: contractTransactionRecord[address].blockNumber,
          deployerId: addedDeployerRecord[address]
        }))
      });
    }

    return _updatedProject;
  });

  return updatedProject;
}
