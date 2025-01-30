import { Address, createPublicClient, http, TransactionReceipt } from 'viem';
import { taiko } from 'viem/chains';
import { prisma } from '@charmverse/core/prisma-client';
import { getLogs } from '@packages/blockchain/provider/ankr/getLogs';
import { getTransactionReceipt } from '@packages/blockchain/provider/ankr/getTransactionReceipt';
import fs from 'fs';
import { prettyPrint } from '@packages/utils/strings';
type BlockchainClient = ReturnType<typeof createPublicClient>;

// Midnight UTC Jan 1, 2025 - get blocks here: https://taikoscan.io/blockdateconverter
const earliestBlockNumber = BigInt(729328);

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

  // // Crack and Stack

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

  // // 21Blackjack (selected for Low Volume)

  '0x8C5720982b54874F53F2514BbD2382ADce98a0ca',
  '0x78adDA11Bfc437DeC4a39318FF7e52Cf00DC062c'
];

async function retrieveContractInteractions({
  address,
  fromBlock,
  toBlock,
  contractId,
  pageSize = BigInt(900)
}: {
  address: Address;
  fromBlock: bigint;
  toBlock: bigint;
  contractId: string;
  pageSize?: bigint;
}) {
  // Get all events from the contract
  let allLogs: Awaited<ReturnType<typeof getLogs>> = [];
  let transactions: Awaited<ReturnType<typeof getTransactionReceipt>>[] = [];

  const earliestBlock = await prisma.scoutProjectContractLog.findFirst({
    where: {
      contractId
    },
    orderBy: {
      blockNumber: 'desc'
    }
  });

  if (earliestBlock) {
    console.log('Found latest block', earliestBlock.blockNumber);
    fromBlock = earliestBlock.blockNumber + BigInt(1);
  }

  for (let currentBlock = fromBlock; currentBlock <= toBlock; currentBlock += pageSize) {
    const nextStep = currentBlock + (pageSize - BigInt(1));
    const endBlock = nextStep > toBlock ? toBlock : nextStep;
    const logs = await getLogs({
      chainId: taiko.id,
      address,
      fromBlock: currentBlock,
      toBlock: endBlock
    });
    // console.log('logs', logs);
    const txHashes = new Set<string>(logs.map((log) => log.transactionHash));
    if (txHashes.size > 0) {
      console.log('Found', logs.length, 'logs and', txHashes.size, 'transactions...');
    }
    console.time('Retrieving transactions');
    const txData = await Promise.all(
      Array.from(txHashes).map((txHash) => getTransactionReceipt({ chainId: taiko.id, txHash }))
    );
    console.timeEnd('Retrieving transactions');

    if (logs.length > 0) {
      await Promise.all([
        prisma.scoutProjectContractTransaction.createMany({
          data: txData.map((tx) => ({
            contractId,
            blockNumber: Number(tx.blockNumber),
            txHash: tx.transactionHash,
            txData: JSON.parse(toJson(tx) || '{}'),
            gasUsed: Number(tx.gasUsed),
            gasPrice: Number(tx.effectiveGasPrice),
            gasCost: Number(tx.gasUsed) * Number(tx.effectiveGasPrice),
            from: tx.from.toLowerCase(),
            to: tx.to ? tx.to.toLowerCase() : '0x0000000000000000000000000000000000000000',
            status: tx.status
          }))
        }),
        prisma.scoutProjectContractLog.createMany({
          data: logs.map((log) => ({
            contractId,
            blockNumber: Number(log.blockNumber),
            txHash: log.transactionHash,
            from: log.address.toLowerCase(),
            logIndex: Number(log.logIndex)
          }))
        })
      ]);
      allLogs = [...allLogs, ...logs];
      // transactions = [...transactions, ...txData];
    }
    // Log progress every 10%
    const progress = Number(((currentBlock - fromBlock) * BigInt(100)) / (toBlock - fromBlock));
    if (progress % 10 === 0) {
      console.log(
        `Processed up to block:`,
        endBlock,
        ` / `,
        allLogs.length.toLocaleString(),
        `logs captured / `,
        progress,
        `% complete`
      );
    }
  }
  const logs = allLogs;

  console.log('Retrieved logs', logs.length);
  // console.log('Retrieved transactions', transactions.length);

  // console.log('log sample', logs.slice(0, 2));
  // console.log('transactions sample', transactions.slice(0, 2));

  // Extract unique addresses that interacted with contract
  const uniqueAddresses = new Set(logs.map((log) => log.address.toLowerCase()));
  console.log('Total unique addresses:', uniqueAddresses.size);
  //console.log('Addresses:', Array.from(uniqueAddresses));
}

async function retrieveContractInteractionsFromLogs({
  fromBlock,
  contractId
}: {
  fromBlock: bigint;
  contractId: string;
}) {
  const earliestBlock = await prisma.scoutProjectContractTransaction.findFirst({
    where: {
      contractId
    },
    orderBy: {
      blockNumber: 'desc'
    }
  });

  if (earliestBlock) {
    console.log(
      'Total txs saved:',
      await prisma.scoutProjectContractTransaction.count({ where: { contractId } }),
      'Latest block number:',
      earliestBlock.blockNumber
    );
    //fromBlock = earliestBlock.blockNumber + BigInt(1);
  }

  const dbLogs = await prisma.scoutProjectContractLog.findMany({
    where: {
      contractId,
      blockNumber: {
        gte: fromBlock
      }
    },
    orderBy: {
      blockNumber: 'asc'
    }
  });
  // console.log('logs', logs);
  const txHashes = Array.from(new Set<string>(dbLogs.map((log) => log.txHash)));
  if (txHashes.length > 0) {
    console.log('Retrieving', txHashes.length, 'transactions for', dbLogs.length, 'logs...');
  }
  const PAGE_SIZE = 1000;
  let skip = 0;
  while (txHashes.length > 0) {
    const txHashChunk = txHashes.slice(skip, skip + PAGE_SIZE);

    if (txHashChunk.length === 0) {
      break;
    }

    const savedHashes = await prisma.scoutProjectContractTransaction.findMany({
      where: {
        contractId,
        txHash: {
          in: txHashChunk
        }
      },
      select: {
        txHash: true
      }
    });
    if (savedHashes.length > 0) {
      console.log('Previously saved txs:', savedHashes.length);
    }
    const newTxHashes = txHashChunk.filter((txHash) => !savedHashes.some((savedHash) => savedHash.txHash === txHash));
    if (newTxHashes.length > 0) {
      console.time('Retrieving transactions');
      const txData = await Promise.all(
        newTxHashes.map((txHash) => getTransactionReceipt({ chainId: taiko.id, txHash }))
      );
      console.timeEnd('Retrieving transactions');

      // prettyPrint(txData);
      // return ;

      const result = await prisma.scoutProjectContractTransaction.createMany({
        data: txData.map((tx) => ({
          contractId,
          blockNumber: Number(tx.blockNumber),
          txHash: tx.transactionHash,
          txData: JSON.parse(toJson(tx) || '{}'),
          gasUsed: Number(tx.gasUsed),
          gasPrice: Number(tx.effectiveGasPrice),
          gasCost: Number(tx.gasUsed) * Number(tx.effectiveGasPrice),
          from: tx.from.toLowerCase(),
          to: tx.to ? tx.to.toLowerCase() : '0x0000000000000000000000000000000000000000',
          status: tx.status
        }))
      });
      // Log progress every 10%
      console.log(
        'Persisted',
        skip + PAGE_SIZE,
        `transactions. Latest block:`,
        Math.max(...txData.map((tx) => Number(tx.blockNumber)))
      );
    }
    skip += PAGE_SIZE;
  }
  // console.log('Retrieved transactions', transactions.length);

  // console.log('log sample', logs.slice(0, 2));
  // console.log('transactions sample', transactions.slice(0, 2));

  // Extract unique addresses that interacted with contract
  // const uniqueAddresses = new Set(logs.map((log) => log.address.toLowerCase()));
  // console.log('Total unique addresses:', uniqueAddresses.size);
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

// splits json into two if it's too large
function toJsonArray(data: any) {
  try {
    const json = toJson(data);
    return json;
  } catch (error) {
    console.error('Could not properly serialize data', error);
    if ((error as Error).name === 'RangeError') {
      const split = Math.floor(data.length / 2);
      return [toJson(data.slice(0, split))!, toJson(data.slice(split))!];
    }
    throw error;
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
      scoutProjectMembers: {
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

async function saveToDisk() {
  // const contracts = await prisma.scoutProjectContract.findMany();
  // console.log('contracts', contracts.length);
  // // store in file
  // fs.writeFileSync('scout_contracts.json', toJson(contracts));

  // const transactions = await prisma.scoutProjectContractTransaction.findMany();
  // console.log('transactions', transactions.length);
  // // store in file
  // fs.writeFileSync('scout_contract_transactions.json', toJson(transactions));

  const PAGE_SIZE = 100000;
  let skip = 0;
  let allLogs: any[] = [];

  while (true) {
    const logs = await prisma.scoutProjectContractLog.findMany({
      orderBy: {
        blockNumber: 'asc'
      },
      take: PAGE_SIZE,
      skip
    });

    if (logs.length === 0) {
      break;
    }

    allLogs = [...allLogs, ...logs];
    skip += PAGE_SIZE;

    console.log(`Retrieved ${allLogs.length} logs so far...`);

    // store in file
    const json = toJsonArray(allLogs) || '[]';
    if (typeof json === 'string') {
      fs.writeFileSync('scout_contract_logs_' + skip + '.json', json);
    } else if (Array.isArray(json)) {
      fs.writeFileSync('scout_contract_logs_' + skip + '.json', json[0]);
      fs.writeFileSync('scout_contract_logs_' + skip + '_2.json', json[1]);
    }
  }

  console.log('logs', allLogs.length);
}

(async () => {
  // await saveToDisk();
  // return;

  // console.log(await prisma.scoutProjectContractTransaction.deleteMany());
  // await prisma.scoutProjectContract.delete({
  //   where: {
  //     address_chainId: {
  //       address: '0x9dd29AA2BD662E6b569524ba00C55be39e7B00fB'.toLowerCase(),
  //       chainId: taiko.id
  //     }
  //   }
  // });

  const client = createPublicClient({
    chain: taiko,
    transport: http()
  });
  const latestBlock = await client.getBlockNumber();

  // create project
  const project = await findOrCreateProject();

  // create contracts
  try {
    for (const contractAddress of contracts) {
      const contract = await findOrCreateContract(
        client,
        project.id,
        contractAddress as Address,
        latestBlock,
        project.createdBy
      );
      // Get block timestamp for deployment block
      console.log('Retrieving events for contract:', contract.address, contract.id, 'Deployed:', contract.deployedAt);
      console.time('Processing time');
      const fromBlock = contract.blockNumber > earliestBlockNumber ? contract.blockNumber : earliestBlockNumber;
      // get contract interactions
      // await retrieveContractInteractions({
      //   address: contractAddress,
      //   fromBlock: fromBlock,
      //   toBlock: latestBlock,
      //   contractId: contract.id
      // });
      await retrieveContractInteractionsFromLogs({
        fromBlock: fromBlock,
        contractId: contract.id
      });
      console.timeEnd('Processing time');
    }
  } catch (error) {
    console.error('Error processing contract:', error);
  }
})();
