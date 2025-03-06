import { log } from '@charmverse/core/log';
import { prisma, ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { recordWalletAnalytics } from '@packages/blockchain/analytics/recordWalletAnalytics';
import { getContractDeployerAddress } from '@packages/blockchain/getContractDeployerAddress';
import { getCurrentWeek, getPreviousWeek } from '@packages/dates/utils';
import { isTruthy } from '@packages/utils/types';
import { verifyMessage } from 'viem';
import { taiko, taikoTestnetSepolia } from 'viem/chains';

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

  const contractAddressesToCreate = projectPayloadContractAddresses.filter(
    (address) => !projectContractAddresses.includes(address)
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

  const builderMemberIds = [...retainedProjectMemberIds, ...projectMemberIdsToRestore, ...projectMemberIdsToCreate];

  const builderMembersCount = await prisma.scout.count({
    where: {
      id: {
        in: builderMemberIds
      },
      OR: [
        {
          builderStatus: 'approved'
        },
        {
          utmCampaign: 'taiko'
        }
      ]
    }
  });

  if (builderMembersCount !== builderMemberIds.length) {
    throw new Error('All project members must be builders');
  }

  if (deployerAddressesToCreate.length) {
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
  }

  if (walletAddressesToCreate.length) {
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
      }
    }
  }

  if (contractAddressesToCreate.length) {
    for (const contractAddress of contractAddressesToCreate) {
      const contract = payload.contracts.find((_contract) => _contract.address === contractAddress);
      if (contract) {
        const { transaction, block } = await getContractDeployerAddress({
          contractAddress: contract.address,
          chainId: contract.chainId
        });
        contractTransactionRecord[contract.address] = {
          chainId: contract.chainId,
          txHash: transaction.hash,
          blockNumber: Number(block.number),
          blockTimestamp: Number(block.timestamp),
          deployerAddress: transaction.from
        };
        if (contract.deployerAddress !== transaction.from) {
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
          // address: wallet.address,
          address: '0x3B60e31CFC48a9074CD5bEbb26C9EAa77650a43F',
          projectId: _updatedProject.id,
          createdBy: userId,
          chainId: wallet.chainId,
          verifiedBy: userId,
          verifiedAt: new Date()
        }))
      });
      for (const wallet of walletAddressesToCreate) {
        const newWallet = await tx.scoutProjectWallet.findUniqueOrThrow({
          where: {
            address_chainId: {
              // address: wallet.address,
              address: '0x3B60e31CFC48a9074CD5bEbb26C9EAa77650a43F',
              chainId: wallet.chainId
            }
          }
        });
        backfillWalletAnalytics(newWallet).catch((error) => {
          log.error(`Error backfilling analytics for wallet ${wallet.address}`, error);
        });
      }
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
          address,
          chainId: contractTransactionRecord[address].chainId,
          deployedAt: new Date(contractTransactionRecord[address].blockTimestamp * 1000),
          deployTxHash: contractTransactionRecord[address].txHash,
          blockNumber: contractTransactionRecord[address].blockNumber,
          deployerId: deployers.find(
            (deployer) => deployer.address === contractTransactionRecord[address].deployerAddress
          )!.id
        }))
      });
      for (const address of contractAddressesToCreate) {
        const newContract = await tx.scoutProjectContract.findUniqueOrThrow({
          where: {
            address_chainId: {
              address,
              chainId: contractTransactionRecord[address].chainId
            }
          }
        });
        // assume evm for now
        backfillWalletAnalytics({ chainType: 'evm', ...newContract }).catch((error) => {
          log.error(`Error backfilling analytics for wallet ${newContract.address}`, {
            contractId: newContract.id,
            error
          });
        });
      }
    }

    return _updatedProject;
  });

  return updatedProject;
}

// Record analytics for the current and past 3 weeks, one week at a time
async function backfillWalletAnalytics(
  wallet: Parameters<typeof recordWalletAnalytics>[0],
  currentWeek = getCurrentWeek()
) {
  // taiko is a separate, very slow process, so skip for now
  if (wallet.chainId === taiko.id || wallet.chainId === taikoTestnetSepolia.id) {
    log.debug('Skipping taiko wallet', { walletId: wallet.id });
    return;
  }
  const weeks: string[] = [];
  while (weeks.length < 4) {
    weeks.unshift(currentWeek); // Add to the beginning of the array so we process the most recent week first
    currentWeek = getPreviousWeek(currentWeek);
  }
  for (const week of weeks) {
    await recordWalletAnalytics(wallet, week);
  }
  log.info(`Backfilled analytics for wallet ${wallet.address}`, { walletId: wallet.id });
}
