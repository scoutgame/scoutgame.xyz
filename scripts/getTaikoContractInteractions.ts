import { Address, createPublicClient } from 'viem';
import { taiko } from 'viem/chains';
import { prisma } from '@charmverse/core/prisma-client';
import { getContractCreation } from '@packages/blockchain/provider/taikoscan/client';
type BlockchainClient = ReturnType<typeof createPublicClient>;

// binary search to find the deployment block
async function findDeploymentBlockNumber(
  client: BlockchainClient,
  contractAddress: Address,
  startBlock: bigint,
  endBlock: bigint
): Promise<bigint> {
  let left = startBlock;
  let right = endBlock;

  while (left <= right) {
    const mid = left + (right - left) / BigInt(2);

    // Check if contract exists at mid block
    const code = await client.getBytecode({
      address: contractAddress,
      blockNumber: mid
    });

    // Check if contract exists at previous block
    const prevCode = await client.getBytecode({
      address: contractAddress,
      blockNumber: mid - BigInt(1)
    });

    // If code exists at mid but not at previous block, we found deployment block
    if (code && !prevCode) {
      return mid;
    }

    // If no code at mid, deployment must be after
    if (!code) {
      left = mid + BigInt(1);
    } else {
      // If code exists at both blocks, deployment must be before
      right = mid - BigInt(1);
    }
  }

  throw new Error('Deployment block not found');
}

async function findOrCreateContract(
  client: BlockchainClient,
  projectId: string,
  address: Address,
  latestBlock: bigint,
  createdBy: string
) {
  const addressLower = address.toLowerCase();
  const contract = await prisma.scoutProjectContract.findFirst({
    where: {
      address: addressLower
    }
  });
  if (contract) {
    return contract;
  }
  const deploymentBlockNumber = await findDeploymentBlockNumber(client, address, BigInt(0), latestBlock);
  const deploymentBlock = await client.getBlock({
    blockNumber: deploymentBlockNumber
  });
  const deploymentTimestamp = new Date(Number(deploymentBlock.timestamp) * 1000);
  const creationData = await getContractCreation(address);
  //console.log('creationData', creationData);
  const creationTxHash = creationData[0].txHash;
  const creationContractAddress = creationData[0].contractAddress;
  const creationContractCreator = creationData[0].contractCreator.toLowerCase();

  const deployer = await prisma.scoutProjectDeployer.findFirst({
    where: {
      address: creationContractCreator,
      projectId
    }
  });

  return prisma.scoutProjectContract.create({
    data: {
      address: addressLower,
      project: {
        connect: {
          id: projectId
        }
      },
      blockNumber: deploymentBlockNumber,
      chainId: taiko.id,
      deployTxHash: creationTxHash,
      deployedAt: deploymentTimestamp,
      createdBy,
      deployer: deployer
        ? {
            connect: {
              id: deployer.id
            }
          }
        : {
            create: {
              address: creationContractCreator,
              projectId
            }
          }
    }
  });
}

async function findOrCreateProject() {
  let creator = await prisma.scout.findFirst();
  if (!creator) {
    creator = await prisma.scout.create({
      data: {
        path: '0x' + Math.random(),
        displayName: 'Scout',
        referralCode: 'scout'
      }
    });
  }
  const project = await prisma.scoutProject.findFirst({
    where: {
      name: 'Taiko'
    }
  });
  if (project) {
    return { id: project.id, createdBy: creator.id };
  }
  const result = await prisma.scoutProject.create({
    data: {
      name: 'Taiko',
      avatar: 'https://taiko.xyz/favicon.ico',
      description: 'Taiko is a decentralized blockchain platform that enables scalable and secure smart contracts.',
      website: 'https://taiko.xyz',
      github: 'https://github.com/taiko-network',
      members: {
        create: {
          createdBy: creator.id,
          user: {
            connect: {
              id: creator.id
            }
          },
          role: 'owner'
        }
      }
    }
  });
  return { id: result.id, createdBy: creator.id };
}

(async () => {})();
