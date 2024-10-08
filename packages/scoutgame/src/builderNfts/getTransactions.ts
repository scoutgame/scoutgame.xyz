import { getPublicClient } from '@packages/onchain/getPublicClient';
import { prettyPrint } from '@packages/utils/strings';
import { createPublicClient, decodeFunctionResult, encodeFunctionData, http, parseEventLogs } from 'viem';
import { mainnet, optimism } from 'viem/chains';

import { realOptimismMainnetBuildersContract } from './constants';

const transferSingle = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: 'address',
      name: 'operator',
      type: 'address'
    },
    {
      indexed: true,
      internalType: 'address',
      name: 'from',
      type: 'address'
    },
    {
      indexed: true,
      internalType: 'address',
      name: 'to',
      type: 'address'
    },
    {
      indexed: false,
      internalType: 'uint256',
      name: 'id',
      type: 'uint256'
    },
    {
      indexed: false,
      internalType: 'uint256',
      name: 'value',
      type: 'uint256'
    }
  ],
  name: 'TransferSingle',
  type: 'event'
};

const builderScouted = {
  anonymous: false,
  inputs: [
    {
      indexed: false,
      internalType: 'uint256',
      name: 'tokenId',
      type: 'uint256'
    },
    {
      indexed: false,
      internalType: 'uint256',
      name: 'amount',
      type: 'uint256'
    },
    {
      indexed: false,
      internalType: 'string',
      name: 'scout',
      type: 'string'
    }
  ],
  name: 'BuilderScouted',
  type: 'event'
};

type TransferSingleEvent = {
  eventName: 'TransferSingle';
  args: {
    operator: string;
    from: string;
    to: string;
    id: string;
    value: string;
  };
  transactionHash: string;
};

type BuilderScoutedEvent = {
  eventName: 'BuilderScouted';
  args: {
    tokenId: string;
    amount: string;
    scout: string;
  };
  transactionHash: string;
};

const contractAbi = [transferSingle, builderScouted];

// Set up your client for the desired chain
const client = createPublicClient({
  chain: mainnet,
  transport: http(`https://opt-mainnet.g.alchemy.com/v2/vTjY0u9L7uoxZQ5GtOw4yKwn7WJelMXp`)
});

// Contract address and the event signature for filtering logs
const contractAddress = realOptimismMainnetBuildersContract;

// Function to get logs for the contract and parse them against the ABI
async function getAndParseLogs() {
  // Fetch logs for the specified contract
  const logs = await client.getLogs({
    address: contractAddress,
    // Start date of the contract
    fromBlock: 126062456n,
    toBlock: 'latest'
  });

  // Parse each log using the ABI
  const parsedLogs = parseEventLogs({ abi: contractAbi, logs, eventName: ['BuilderScouted', 'TransferSingle'] });

  return parsedLogs;
}

type ParsedLogs = Awaited<ReturnType<typeof getAndParseLogs>>;

type GroupedEvent = {
  scoutId: string;
  amount: bigint;
  tokenId: bigint;
  txHash: string;
  transferEvent: TransferSingleEvent;
  builderScoutedEvent: BuilderScoutedEvent;
};

function groupEventsByTransactionHash(events: ParsedLogs): GroupedEvent[] {
  // Create a map to hold grouped events by transaction hash
  const eventMap: Record<string, Partial<GroupedEvent>> = {};

  // Iterate over each event
  for (const baseEvent of events) {
    const event = baseEvent as ParsedLogs[number] & { eventName: 'TransferSingle' | 'BuilderScouted' } & {
      args: BuilderScoutedEvent['args'] | TransferSingleEvent['args'];
    };
    const { transactionHash } = event;

    // Initialize the object in the map if not already present
    if (!eventMap[transactionHash]) {
      eventMap[transactionHash] = { txHash: transactionHash };
    }

    // Add the event to the appropriate property based on its name
    if (event.eventName === 'TransferSingle') {
      const transferSingleEvent = event as TransferSingleEvent;
      eventMap[transactionHash].transferEvent = transferSingleEvent;
      eventMap[transactionHash].tokenId = BigInt(transferSingleEvent.args.id);
    } else if (event.eventName === 'BuilderScouted') {
      const builderScoutedEvent = event as BuilderScoutedEvent;
      eventMap[transactionHash].builderScoutedEvent = builderScoutedEvent;
      eventMap[transactionHash].scoutId = builderScoutedEvent.args.scout;
      eventMap[transactionHash].amount = BigInt(builderScoutedEvent.args.amount);
    }
  }

  // Convert the map values to an array of fully populated GroupedEvent objects
  return Object.values(eventMap).map((entry) => ({
    scoutId: entry.scoutId!,
    amount: entry.amount!,
    tokenId: entry.tokenId!,
    txHash: entry.txHash!,
    transferEvent: entry.transferEvent!,
    builderScoutedEvent: entry.builderScoutedEvent!
  }));
}

async function getLogsByUserId({ scoutId }: { scoutId: string }) {
  const logs = await getAndParseLogs();

  // Call the grouping function and log the output
  const groupedEvents = groupEventsByTransactionHash(logs as any);

  return groupedEvents.filter((event) => event.scoutId === scoutId);
}

async function getTokenPurchasePrice(params: {
  args: { tokenId: bigint; amount: bigint };
  blockNumber?: bigint;
}): Promise<bigint> {
  const abi = [
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        }
      ],
      name: 'getTokenPurchasePrice',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    }
  ];

  const txData = encodeFunctionData({
    abi,
    functionName: 'getTokenPurchasePrice',
    args: [params.args.tokenId, params.args.amount]
  });

  const { data } = await getPublicClient(optimism.id).call({
    to: realOptimismMainnetBuildersContract,
    data: txData,
    blockNumber: params.blockNumber
  });

  // Decode the result based on the expected return type
  const result = decodeFunctionResult({
    abi,
    functionName: 'getTokenPurchasePrice',
    data: data as `0x${string}`
  });

  return result as bigint;
}

// getTokenPurchasePrice({
//   args: { tokenId: 97n, amount: 1n },
//   blockNumber: 126405468n
// }).then(prettyPrint);

// getLogsByUserId({ scoutId: 'b9a5b3ac-a67b-4c3b-b1d5-ee59edda3e07' }).then(prettyPrint);
