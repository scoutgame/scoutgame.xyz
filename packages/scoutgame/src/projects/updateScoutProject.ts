import { log } from '@charmverse/core/log';
import { prisma, ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { getContractDeployerAddress } from '@packages/blockchain/getContractDeployerAddress';
import { isSmartContractAddress } from '@packages/blockchain/utils';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { isTruthy } from '@packages/utils/types';
import { verifyMessage } from 'viem';

import { backfillAnalytics } from './backfillAnalytics';
import { AGENT_WALLET_SIGN_MESSAGE, CONTRACT_DEPLOYER_SIGN_MESSAGE } from './constants';
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

  if (payload.deployers) {
    payload.deployers = payload.deployers.map((d) => ({
      ...d,
      address: d.address.toLowerCase()
    }));
  }

  if (payload.wallets) {
    payload.wallets = payload.wallets.map((w) => ({
      ...w,
      address: w.address.toLowerCase()
    }));
  }

  if (payload.contracts) {
    payload.contracts = payload.contracts.map((c) => ({
      ...c,
      address: c.address.toLowerCase(),
      deployerAddress: c.deployerAddress.toLowerCase()
    }));
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
      },
      wallets: {
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
  const projectWalletAddresses = project.wallets.map((wallet) => wallet.address.toLowerCase());
  const projectPayloadMemberIds = payload.teamMembers.map((member) => member.scoutId);
  const projectPayloadDeployerAddresses = payload.deployers.map((deployer) => deployer.address);
  const projectPayloadContractAddresses = payload.contracts.map((contract) => contract.address);
  const projectPayloadWalletAddresses = payload.wallets.map((wallet) => wallet.address);

  const contractAddressesToCreate = payload.contracts.filter(
    (contract) => !projectContractAddresses.includes(contract.address)
  );
  const contractAddressesToRemove = projectContractAddresses.filter(
    (address) => !projectPayloadContractAddresses.includes(address)
  );

  // Find deployer addresses that exist in payload but not in database (need to be created)
  const deployerAddressesToCreate = projectPayloadDeployerAddresses.filter(
    (address) => !projectDeployerAddresses.includes(address)
  );

  const walletAddressesToCreate = payload.wallets.filter((wallet) => !projectWalletAddresses.includes(wallet.address));
  const walletAddressesToRemove = projectWalletAddresses.filter(
    (address) => !projectPayloadWalletAddresses.includes(address)
  );
  const projectMemberIdsToCreate = projectPayloadMemberIds.filter((scoutId) => !projectMemberIds.includes(scoutId));

  const projectMemberIdsToRemove = projectMemberIds.filter((scoutId) => !projectPayloadMemberIds.includes(scoutId));

  const deletedProjectMemberIds = project.members.filter((member) => member.deletedAt).map((member) => member.userId);

  const deletedContractAddresses = project.contracts
    .filter((contract) => contract.deletedAt)
    .map((contract) => contract.address);

  const deletedWalletAddresses = project.wallets.filter((wallet) => wallet.deletedAt).map((wallet) => wallet.address);

  const projectMemberIdsToRestore = deletedProjectMemberIds.filter((scoutId) =>
    projectPayloadMemberIds.includes(scoutId)
  );

  const contractAddressesToRestore = deletedContractAddresses.filter((address) =>
    projectPayloadContractAddresses.includes(address)
  );

  const deletedWalletAddressesToRestore = deletedWalletAddresses.filter((address) =>
    projectPayloadWalletAddresses.includes(address)
  );

  const retainedProjectMemberIds = projectMemberIds.filter((scoutId) => projectPayloadMemberIds.includes(scoutId));

  for (const deployerAddress of deployerAddressesToCreate) {
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

  for (const walletAddress of walletAddressesToCreate) {
    const wallet = payload.wallets.find((_wallet) => _wallet.address === walletAddress.address);

    if (wallet) {
      const isValidSignature = await verifyMessage({
        message: AGENT_WALLET_SIGN_MESSAGE,
        signature: wallet.signature as `0x${string}`,
        address: wallet.address as `0x${string}`
      });

      if (!isValidSignature) {
        throw new Error(`Invalid signature for wallet ${wallet.address}`);
      }

      const isSmartContract = await isSmartContractAddress(wallet.address as `0x${string}`, wallet.chainId);
      if (isSmartContract) {
        throw new Error(`Address ${wallet.address} is a smart contract, not a wallet`);
      }
    } else {
      log.error(`Wallet ${walletAddress} not found in payload`);
    }
  }

  for (const contract of contractAddressesToCreate) {
    const { transaction, block } = await getContractDeployerAddress({
      contractAddress: contract.address,
      chainId: contract.chainId
    });

    if (contract.deployerAddress !== transaction.from) {
      throw new Error(
        `Contract ${contract.address} was not deployed by the provided deployer. Actual deployer: ${transaction.from}`
      );
    }

    contractTransactionRecord[contract.address] = {
      chainId: contract.chainId,
      txHash: transaction.hash,
      blockNumber: Number(block.number),
      blockTimestamp: Number(block.timestamp),
      deployerAddress: transaction.from
    };
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

    if (walletAddressesToRemove.length) {
      await tx.scoutProjectWallet.updateMany({
        where: {
          address: {
            in: walletAddressesToRemove
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

    if (deletedWalletAddressesToRestore.length) {
      await tx.scoutProjectWallet.updateMany({
        where: {
          address: {
            in: deletedWalletAddressesToRestore
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
          address,
          projectId: _updatedProject.id,
          verifiedBy: userId,
          verifiedAt: new Date()
        }))
      });
    }

    if (walletAddressesToCreate.length) {
      await tx.scoutProjectWallet.createMany({
        data: walletAddressesToCreate.map((wallet) => ({
          address: wallet.address,
          projectId: _updatedProject.id,
          createdBy: userId,
          chainId: wallet.chainId,
          chainType: 'evm',
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
        data: contractAddressesToCreate
          .filter((contract) => contractTransactionRecord[contract.address])
          .map(({ address, chainId }) => ({
            createdBy: userId,
            projectId: _updatedProject.id,
            address,
            chainId,
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

  // backfill analytics for contracts and wallets
  backfillAnalytics({
    contracts: contractAddressesToCreate.map(({ address, chainId }) => ({
      address,
      chainId
    })),
    wallets: walletAddressesToCreate,
    userId
  }).catch((error) => {
    log.error('Error backfilling analytics for project', {
      contracts: contractAddressesToCreate,
      wallets: walletAddressesToCreate,
      error
    });
  });

  for (const { address, chainId } of walletAddressesToCreate) {
    trackUserAction('add_project_agent_address', {
      userId,
      projectId: updatedProject.id,
      walletAddress: address,
      chainId
    });
  }

  for (const { address, chainId } of contractAddressesToCreate) {
    trackUserAction('add_project_contract_address', {
      userId,
      projectId: updatedProject.id,
      contractAddress: address,
      chainId
    });
  }

  return updatedProject;
}
