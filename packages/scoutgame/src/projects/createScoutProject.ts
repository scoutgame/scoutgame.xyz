import { log } from '@charmverse/core/log';
import type { ScoutProjectDeployer, ScoutProjectMemberRole } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import {
  uploadUrlToS3,
  getFilenameWithExtension,
  uploadFileToS3,
  getUserS3FilePath
} from '@packages/aws/uploadToS3Server';
import { getContractDeployerAddress } from '@packages/blockchain/getContractDeployerAddress';
import { isTruthy } from '@packages/utils/types';
import sharp from 'sharp';
import { verifyMessage } from 'viem';

import { AGENT_WALLET_SIGN_MESSAGE, CONTRACT_DEPLOYER_SIGN_MESSAGE } from './constants';
import type { CreateScoutProjectFormValues } from './createScoutProjectSchema';
import { generateProjectPath } from './generateProjectPath';
import { generateRandomAvatar } from './generateRandomAvatar';
import { backfillWalletAnalytics } from './updateScoutProject';

export async function createScoutProject(payload: CreateScoutProjectFormValues, userId: string) {
  const path = await generateProjectPath(payload.name);
  const contractRecord: Record<string, { txHash: string; blockNumber: number; blockTimestamp: number }> = {};

  const ownerCount = payload.teamMembers.filter((member) => member.role === 'owner').length;

  if (ownerCount === 0) {
    throw new Error('At least one owner is required');
  }

  if (ownerCount !== 1) {
    throw new Error('Only one owner is allowed per project');
  }

  if (payload.deployers) {
    // Ensure all deployer addresses are in lowercase
    payload.deployers = payload.deployers.map((d) => ({
      ...d,
      address: d.address.toLowerCase()
    }));

    for (const deployer of payload.deployers) {
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

  if (payload.wallets) {
    // Ensure all wallet addresses are in lowercase
    payload.wallets = payload.wallets.map((w) => ({
      ...w,
      address: w.address.toLowerCase()
    }));

    for (const wallet of payload.wallets) {
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

  if (payload.contracts) {
    // Ensure all contract addresses are in lowercase
    payload.contracts = payload.contracts.map((c) => ({
      ...c,
      address: c.address.toLowerCase(),
      deployerAddress: c.deployerAddress.toLowerCase()
    }));

    for (const contract of payload.contracts) {
      const { block, transaction } = await getContractDeployerAddress({
        contractAddress: contract.address,
        chainId: contract.chainId
      });

      contractRecord[contract.address] = {
        txHash: transaction.hash,
        blockNumber: Number(block.number),
        blockTimestamp: Number(block.timestamp)
      };

      if (contract.deployerAddress !== transaction.from) {
        throw new Error(
          `Contract ${contract.address} was not deployed by the provided deployer. Actual deployer: ${transaction.from}`
        );
      }
    }
  }

  if (!payload.avatar) {
    const randomAvatarSvg = generateRandomAvatar();
    const imageBuffer = await sharp(Buffer.from(randomAvatarSvg)).resize(256, 256).png().toBuffer();

    const pathInS3 = getUserS3FilePath({ userId, url: 'avatar.png' });
    try {
      const { fileUrl } = await uploadFileToS3({
        pathInS3,
        content: imageBuffer,
        contentType: 'image/png'
      });
      payload.avatar = fileUrl;
    } catch (e) {
      log.error('Failed to save avatar', { error: e, pathInS3, userId });
    }
  } else if (payload.avatar) {
    const pathInS3 = getUserS3FilePath({ userId, url: getFilenameWithExtension(payload.avatar) });
    try {
      const { url } = await uploadUrlToS3({ pathInS3, url: payload.avatar });
      payload.avatar = url;
    } catch (e) {
      log.error('Failed to save avatar', { error: e, pathInS3, url: payload.avatar, userId });
    }
  }

  const builderMembersCount = await prisma.scout.count({
    where: {
      id: {
        in: payload.teamMembers.map((member) => member.scoutId)
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

  if (builderMembersCount !== payload.teamMembers.length) {
    throw new Error('All project members must be approved builders');
  }

  const project = await prisma.$transaction(async (tx) => {
    const scoutProject = await tx.scoutProject.create({
      data: {
        name: payload.name,
        avatar: payload.avatar ?? '',
        description: payload.description ?? '',
        website: payload.website ?? '',
        github: payload.github ?? '',
        path,
        deployers:
          payload.deployers && payload.deployers.length
            ? {
                createMany: {
                  data: payload.deployers.map((deployer) => ({
                    address: deployer.address,
                    verifiedBy: userId,
                    verifiedAt: new Date()
                  }))
                }
              }
            : undefined,
        members: {
          createMany: {
            data: payload.teamMembers.map((member) => ({
              userId: member.scoutId,
              createdBy: userId,
              role: member.role as ScoutProjectMemberRole
            }))
          }
        },
        wallets:
          payload.wallets && payload.wallets.length
            ? {
                createMany: {
                  data: payload.wallets.map((wallet) => ({
                    address: wallet.address,
                    chainId: wallet.chainId,
                    chainType: 'evm',
                    verifiedBy: userId,
                    verifiedAt: new Date(),
                    createdBy: userId
                  }))
                }
              }
            : undefined
      },
      select: {
        id: true,
        path: true,
        name: true,
        deployers: true
      }
    });

    const deployers = scoutProject.deployers as ScoutProjectDeployer[];

    if (payload.contracts && payload.contracts.length) {
      await tx.scoutProjectContract.createMany({
        data: payload.contracts
          .map((contract) => {
            const deployer = deployers.find((d) => d.address === contract.deployerAddress);
            if (!deployer) {
              // This case will ideally never happen, its added to keep the type checker happy
              return null;
            }
            return {
              createdBy: userId,
              projectId: scoutProject.id,
              address: contract.address,
              chainId: contract.chainId,
              deployedAt: new Date(contractRecord[contract.address].blockTimestamp * 1000),
              deployerId: deployer.id,
              deployTxHash: contractRecord[contract.address].txHash,
              blockNumber: contractRecord[contract.address].blockNumber
            };
          })
          .filter(isTruthy)
      });
    }

    return scoutProject;
  });

  if (payload.wallets) {
    for (const wallet of payload.wallets) {
      const newWallet = await prisma.scoutProjectWallet.findUnique({
        where: {
          address_chainId: {
            address: wallet.address,
            chainId: wallet.chainId
          }
        }
      });
      if (newWallet) {
        try {
          // assume evm for now
          const result = await backfillWalletAnalytics(newWallet);
          if (result) {
            log.info(`Backfilled analytics for wallet ${newWallet.address}`, {
              endDate: result.endDate,
              startDate: result.startDate,
              userId,
              walletId: newWallet.id
            });
          }
        } catch (error) {
          log.error(`Error backfilling analytics for wallet ${newWallet.address}`, {
            contractId: newWallet.id,
            userId,
            error
          });
        }
      }
    }
  }
  return {
    id: project.id,
    path: project.path,
    name: project.name
  };
}
