import { createPublicClient, http } from 'viem';
import { taiko } from 'viem/chains';

/**
 * Taiko Contract exmples

Avalon Finance

0xb961661F5Ca019e232661Bd26686288a6E21d928
0xC8ef1F781CA76E344e7B5c5C136834c132B5A1E8
0x64Eaf7cDE96277ed9253b8268DFC85eB2EB0D147
0xF4858292f8985371d440Ec17cD0fC8bA22867f8e
0x9dd29AA2BD662E6b569524ba00C55be39e7B00fB
0xC1bFbF4E0AdCA79790bfa0A557E4080F05e2B438

Crack and Stack

0xF8F1B21615BDbEA8D142cfaf4828EA0236Cab115
0x12689b6ddE632E69fBAA70d066f86aC9fDd33dd1
0x2c301eBfB0bb42Af519377578099b63E921515B7
0x009C32F03d6eEa4F6DA9DD3f8EC7Dc85824Ae0e6
0x1ACa21A2a2a070d3536a69733c7044feDEB88f5A
0x7ddB8A975778a434dE03dd666F11Ce962DCdD290
0x6C8865042792B5E919fC95bF771ccaDF6F0cfA22
0xD31A4be996b7E1cc20974181127E6fCA15649913
0xA9EC1fEEE212851c829B028F094156CD04A3a547
0xb64C1461453DAdD104A583dCCeef30ce296fde20
0xD8F7cd7d919c5266777FB83542F956dD30E80187

21Blackjack (selected for Low Volume)

0x8C5720982b54874F53F2514BbD2382ADce98a0ca
0x78adDA11Bfc437DeC4a39318FF7e52Cf00DC062c

*/

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
