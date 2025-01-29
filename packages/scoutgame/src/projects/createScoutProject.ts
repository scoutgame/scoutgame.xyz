import { log } from '@charmverse/core/log';
import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import {
  uploadUrlToS3,
  getFilenameWithExtension,
  uploadFileToS3,
  getUserS3FilePath
} from '@packages/aws/uploadToS3Server';
import { getContractDeployerAddress } from '@packages/blockchain/getContractDeployerAddress';
import sharp from 'sharp';
import { verifyMessage } from 'viem';

import { CONTRACT_DEPLOYER_SIGN_MESSAGE } from './constants';
import type { CreateScoutProjectFormValues } from './createScoutProjectSchema';
import { generateProjectPath } from './generateProjectPath';
import { generateRandomAvatar } from './generateRandomAvatar';

export async function createScoutProject(payload: CreateScoutProjectFormValues, userId: string) {
  const path = await generateProjectPath(payload.name);

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

  if (payload.contracts) {
    for (const contract of payload.contracts) {
      const actualDeployer = await getContractDeployerAddress({
        contractAddress: contract.address,
        chainId: contract.chainId
      });

      if (contract.deployerAddress.toLowerCase() !== actualDeployer.toLowerCase()) {
        throw new Error(
          `Contract ${contract.address} was not deployed by the provided deployer. Actual deployer: ${actualDeployer}`
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
                    verifiedBy: userId,
                    verifiedAt: new Date()
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
        path: true,
        scoutProjectDeployers: true
      }
    });

    const scoutProjectDeployers = scoutProject.scoutProjectDeployers;

    if (payload.contracts && payload.contracts.length) {
      await tx.scoutProjectContract.createMany({
        data: payload.contracts.map((contract) => {
          const deployer = scoutProjectDeployers.find(
            (d) => d.address.toLowerCase() === contract.deployerAddress.toLowerCase()
          );
          if (!deployer) {
            throw new Error(`Deployer not found for contract ${contract.address}`);
          }
          return {
            createdBy: userId,
            projectId: scoutProject.id,
            address: contract.address,
            chainId: contract.chainId,
            deployedAt: new Date(),
            deployerId: deployer.id,
            deployTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            blockNumber: 0
          };
        })
      });
    }

    return scoutProject;
  });

  return {
    id: project.id,
    path: project.path
  };
}
