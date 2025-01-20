import { createPublicClient, http } from 'viem';
import { taiko } from 'viem/chains';

async function getContractInteractions(
  client: any,
  address: string,
  fromBlock: bigint,
  toBlock: bigint,
  pageSize: bigint = BigInt(1000)
) {
  // Get all events from the contract
  let allLogs: Awaited<ReturnType<typeof client.getLogs>> = [];
  for (let currentBlock = fromBlock; currentBlock <= toBlock; currentBlock += pageSize) {
    const nextStep = currentBlock + (pageSize - BigInt(1));
    const endBlock = nextStep > toBlock ? toBlock : nextStep;
    const logs = await client.getLogs({
      address,
      fromBlock: currentBlock,
      toBlock: endBlock
    });
    allLogs = [...allLogs, ...logs];
    console.log('logs', logs.length);
  }
  const logs = allLogs;

  console.log('found logs', logs.length);

  console.log('log sample', logs.slice(0, 5));

  // Extract unique addresses that interacted with contract
  const uniqueAddresses = new Set(logs.map((log) => log.address.toLowerCase()));
  console.log('Total unique addresses:', uniqueAddresses.size);
  console.log('Addresses:', Array.from(uniqueAddresses));
}

// binary search to find the deployment block
async function findDeploymentBlock(
  client: any,
  contractAddress: string,
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
  const address = '0xF8F1B21615BDbEA8D142cfaf4828EA0236Cab115';

  console.log('Contract address:', address);

  const client = createPublicClient({
    chain: taiko,
    transport: http()
  });
  const latestBlock = await client.getBlockNumber();
  const deploymentBlock = await findDeploymentBlock(client, address, BigInt(0), latestBlock);
  console.log('Deployment block:', deploymentBlock);
  await getContractInteractions(client, address, deploymentBlock, latestBlock);
})();

// getContractInteractions();
