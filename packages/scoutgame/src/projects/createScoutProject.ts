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
    for (const contract of payload.contracts) {
      const { block, transaction } = await getContractDeployerAddress({
        contractAddress: contract.address.toLowerCase(),
        chainId: contract.chainId
      });

      contractRecord[contract.address.toLowerCase()] = {
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

  const builderMembers = await prisma.scout.findMany({
    where: {
      id: {
        in: payload.teamMembers.map((member) => member.scoutId)
      }
    },
    select: {
      utmCampaign: true,
      builderStatus: true
    }
  });

  const builderMembersCount = builderMembers.filter(
    (member) => member.builderStatus === 'approved' || member.utmCampaign === 'taiko'
  ).length;

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
                    address: deployer.address.toLowerCase(),
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
                    address: wallet.address.toLowerCase(),
                    chainId: wallet.chainId,
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
            const deployer = deployers.find((d) => d.address.toLowerCase() === contract.deployerAddress.toLowerCase());
            if (!deployer) {
              // This case will ideally never happen, its added to keep the type checker happy
              return null;
            }
            return {
              createdBy: userId,
              projectId: scoutProject.id,
              address: contract.address.toLowerCase(),
              chainId: contract.chainId,
              deployedAt: new Date(contractRecord[contract.address.toLowerCase()].blockTimestamp * 1000),
              deployerId: deployer.id,
              deployTxHash: contractRecord[contract.address.toLowerCase()].txHash,
              blockNumber: contractRecord[contract.address.toLowerCase()].blockNumber
            };
          })
          .filter(isTruthy)
      });
    }

    return scoutProject;
  });

  return {
    id: project.id,
    path: project.path,
    name: project.name
  };
}
