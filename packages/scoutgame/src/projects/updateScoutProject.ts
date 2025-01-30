import type { ScoutProjectDeployer } from '@charmverse/core/prisma-client';
import { prisma, ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { getContractDeployerAddress } from '@packages/blockchain/getContractDeployerAddress';
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

  const contractAddressesToCreate =
    payload.contracts
      ?.map((contract) => contract.address.toLowerCase())
      .filter((address) => !projectContractAddresses.includes(address)) ?? [];
  const deployerAddressesToCreate =
    payload.deployers
      ?.map((deployer) => deployer.address.toLowerCase())
      .filter((address) => !projectDeployerAddresses.includes(address)) ?? [];
  const projectMemberIdsToCreate =
    payload.teamMembers?.map((member) => member.scoutId).filter((scoutId) => !projectMemberIds.includes(scoutId)) ?? [];

  const contractAddressesToRemove =
    payload.contracts &&
    projectContractAddresses.filter(
      (address) => !payload.contracts!.some((contract) => contract.address.toLowerCase() === address.toLowerCase())
    );
  const projectMemberIdsToRemove =
    payload.teamMembers &&
    projectMemberIds.filter((scoutId) => !payload.teamMembers!.some((member) => member.scoutId === scoutId));

  const deletedProjectMemberIds = project.scoutProjectMembers
    .filter((member) => member.deletedAt)
    .map((member) => member.userId);
  const deletedContractAddresses = project.scoutProjectContracts
    .filter((contract) => contract.deletedAt)
    .map((contract) => contract.address.toLowerCase());

  const projectMemberIdsToRestore = deletedProjectMemberIds.filter((scoutId) =>
    payload.teamMembers?.map((member) => member.scoutId).includes(scoutId)
  );
  const contractAddressesToRestore = deletedContractAddresses.filter((address) =>
    payload.contracts?.map((contract) => contract.address.toLowerCase()).includes(address)
  );

  if (payload.deployers && deployerAddressesToCreate.length > 0) {
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

  if (payload.contracts && contractAddressesToCreate.length > 0) {
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

    if (contractAddressesToRemove && contractAddressesToRemove.length > 0) {
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

    if (projectMemberIdsToRemove && projectMemberIdsToRemove.length > 0) {
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

    if (projectMemberIdsToRestore && projectMemberIdsToRestore.length > 0) {
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

    if (contractAddressesToRestore && contractAddressesToRestore.length > 0) {
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

    if (projectMemberIdsToCreate && projectMemberIdsToCreate.length > 0) {
      await tx.scoutProjectMember.createMany({
        data: projectMemberIdsToCreate.map((scoutId) => ({
          userId: scoutId,
          projectId: _updatedProject.id,
          role: ScoutProjectMemberRole.member,
          createdBy: userId
        }))
      });
    }

    let deployers: ScoutProjectDeployer[] = [];

    if (deployerAddressesToCreate.length > 0) {
      deployers = await Promise.all(
        deployerAddressesToCreate.map((address) => {
          return tx.scoutProjectDeployer.create({
            data: {
              address: address.toLowerCase(),
              projectId: _updatedProject.id,
              verifiedBy: userId,
              verifiedAt: new Date()
            }
          });
        })
      );
    }
    if (contractAddressesToCreate.length > 0) {
      const contractsWithoutDeployer = contractAddressesToCreate.filter(
        (address) => !deployers.some((deployer) => deployer.address === address.toLowerCase())
      );

      if (contractsWithoutDeployer.length > 0) {
        throw new Error(`No deployer found for contract ${contractsWithoutDeployer.join(', ')}`);
      }

      await tx.scoutProjectContract.createMany({
        data: contractAddressesToCreate.map((address) => ({
          createdBy: userId,
          projectId: _updatedProject.id,
          address: address.toLowerCase(),
          chainId: contractTransactionRecord[address].chainId,
          deployedAt: new Date(contractTransactionRecord[address].blockTimestamp * 1000),
          deployTxHash: contractTransactionRecord[address].txHash,
          blockNumber: contractTransactionRecord[address].blockNumber,
          deployerId: deployers.find((deployer) => deployer.address === address.toLowerCase())!.id
        }))
      });
    }

    return _updatedProject;
  });

  return updatedProject;
}
