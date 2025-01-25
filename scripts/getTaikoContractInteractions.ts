import { Address, createPublicClient, http, TransactionReceipt } from 'viem';
import { taiko } from 'viem/chains';
import { prisma } from '@charmverse/core/prisma-client';

type BlockchainClient = ReturnType<typeof createPublicClient>;

/**
 * Taiko Contract exmples */
const contracts: Address[] = [
  // Avalon Finance

  '0xb961661F5Ca019e232661Bd26686288a6E21d928',
  '0xC8ef1F781CA76E344e7B5c5C136834c132B5A1E8',
  '0x64Eaf7cDE96277ed9253b8268DFC85eB2EB0D147',
  '0xF4858292f8985371d440Ec17cD0fC8bA22867f8e',
  '0x9dd29AA2BD662E6b569524ba00C55be39e7B00fB',
  '0xC1bFbF4E0AdCA79790bfa0A557E4080F05e2B438',

  // Crack and Stack

  '0xF8F1B21615BDbEA8D142cfaf4828EA0236Cab115',
  '0x12689b6ddE632E69fBAA70d066f86aC9fDd33dd1',
  '0x2c301eBfB0bb42Af519377578099b63E921515B7',
  '0x009C32F03d6eEa4F6DA9DD3f8EC7Dc85824Ae0e6',
  '0x1ACa21A2a2a070d3536a69733c7044feDEB88f5A',
  '0x7ddB8A975778a434dE03dd666F11Ce962DCdD290',
  '0x6C8865042792B5E919fC95bF771ccaDF6F0cfA22',
  '0xD31A4be996b7E1cc20974181127E6fCA15649913',
  '0xA9EC1fEEE212851c829B028F094156CD04A3a547',
  '0xb64C1461453DAdD104A583dCCeef30ce296fde20',
  '0xD8F7cd7d919c5266777FB83542F956dD30E80187',

  // 21Blackjack (selected for Low Volume)

  '0x8C5720982b54874F53F2514BbD2382ADce98a0ca',
  '0x78adDA11Bfc437DeC4a39318FF7e52Cf00DC062c'
];

async function retrieveContractInteractions({
  client,
  address,
  fromBlock,
  toBlock,
  contractId,
  pageSize = BigInt(1000)
}: {
  client: BlockchainClient;
  address: Address;
  fromBlock: bigint;
  toBlock: bigint;
  contractId: string;
  pageSize?: bigint;
}) {
  // Get all events from the contract
  let allLogs: Awaited<ReturnType<typeof client.getLogs>> = [];
  let transactions: TransactionReceipt[] = [];

  const earliestBlock = await prisma.scoutProjectContractTransactioData.findFirst({
    where: {
      contractId
    },
    orderBy: {
      blockNumber: 'desc'
    }
  });

  if (earliestBlock) {
    console.log('Found latest block', earliestBlock.blockNumber);
    fromBlock = earliestBlock.blockNumber;
  }

  for (let currentBlock = fromBlock; currentBlock <= toBlock; currentBlock += pageSize) {
    const nextStep = currentBlock + (pageSize - BigInt(1));
    const endBlock = nextStep > toBlock ? toBlock : nextStep;
    const logs = await client.getLogs({
      address,
      fromBlock: currentBlock,
      toBlock: endBlock
    });
    const txHashes = new Set<Address>(logs.map((log) => log.transactionHash));
    const txData = await Promise.all(
      Array.from(txHashes).map((txHash) => client.getTransactionReceipt({ hash: txHash }))
    );
    await Promise.all([
      prisma.scoutProjectContractTransactioData.createMany({
        data: txData.map((tx) => ({
          contractId,
          blockNumber: tx.blockNumber,
          txHash: tx.transactionHash,
          logIndex: tx.transactionIndex,
          txData: JSON.parse(toJson(tx) || '{}'),
          from: tx.from.toLowerCase(),
          to: tx.to ? tx.to.toLowerCase() : '0x0000000000000000000000000000000000000000',
          status: tx.status
        }))
      })
      // prisma.scoutProjectContractTransaction.createMany({
      //   data: logs.map((log) => ({
      //     contractId,
      //     blockNumber: log.blockNumber,
      //     txHash: log.transactionHash,
      //     from: log.address.toLowerCase(),
      //     gasUsed: txDataByHash[log.transactionHash].gasUsed,
      //     to: log.address.toLowerCase(),
      //     status: log.removed ? 'removed' : 'success'
      //   }))
      // })
    ]);
    allLogs = [...allLogs, ...logs];
    transactions = [...transactions, ...txData];
    // Log progress every 10%
    const progress = Number(((currentBlock - fromBlock) * BigInt(100)) / (toBlock - fromBlock));
    if (progress % 10 === 0) {
      console.log(`${progress}% complete, ${allLogs.length} events processed so far`);
    }
  }
  const logs = allLogs;

  console.log('found logs', logs.length);
  console.log('found transactions', transactions.length);

  console.log('log sample', logs.slice(0, 2));
  console.log('transactions sample', transactions.slice(0, 2));

  // Extract unique addresses that interacted with contract
  const uniqueAddresses = new Set(logs.map((log) => log.address.toLowerCase()));
  console.log('Total unique addresses:', uniqueAddresses.size);
  //console.log('Addresses:', Array.from(uniqueAddresses));
}

// handle bigint serialization
function toJson(data: any) {
  if (data !== undefined) {
    return JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? `${v}#bigint` : v)).replace(
      /"(-?\d+)#bigint"/g,
      (_, a) => a
    );
  }
}
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

// call findDeploymentBlock
(async () => {
  // await prisma.scoutProjectContract.deleteMany();
  const client = createPublicClient({
    chain: taiko,
    transport: http()
  });
  const latestBlock = await client.getBlockNumber();
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

  // create project
  const project = await findOrCreateProject();

  // create contracts
  for (const contractAddress of contracts) {
    const contract = await findOrCreateContract(
      client,
      project.id,
      contractAddress as Address,
      latestBlock,
      creator.id
    );
    // Get block timestamp for deployment block
    console.log('Retrieving events for contract:', contract.address, 'Deployed:', contract.deployedAt);
    // get contract interactions
    await retrieveContractInteractions({
      client,
      address: contractAddress,
      fromBlock: contract.blockNumber,
      toBlock: latestBlock,
      contractId: contract.id
    });
  }
})();

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
  console.log('creationData', creationData);
  const creationTxHash = creationData.result[0].txHash;
  const creationContractAddress = creationData.result[0].contractAddress;
  const creationContractCreator = creationData.result[0].contractCreator.toLowerCase();

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
  const project = await prisma.scoutProject.findFirst({
    where: {
      name: 'Taiko'
    }
  });
  if (project) {
    return project;
  }
  return prisma.scoutProject.create({
    data: {
      name: 'Taiko',
      avatar: 'https://taiko.xyz/favicon.ico',
      description: 'Taiko is a decentralized blockchain platform that enables scalable and secure smart contracts.',
      website: 'https://taiko.xyz',
      github: 'https://github.com/taiko-network'
    }
  });
}

// taiko methods
async function getContractSourceCode(address: string) {
  return getContractApi('&action=getsourcecode&address=' + address);
}

async function getContractCreation(address: string) {
  return getContractApi<{ result: { contractAddress: Address; contractCreator: Address; txHash: string }[] }>(
    '&action=getcontractcreation&contractaddresses=' + address
  );
}

async function getContractApi<T>(queryStr: string): Promise<T> {
  const apiKey = process.env.TAIKO_API_KEY;
  const url = `https://api.taikoscan.io/api?apikey=${apiKey}&module=contract${queryStr}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching contract source code:', error);
    throw error;
  }
}

// retrieveContractInteractions();
