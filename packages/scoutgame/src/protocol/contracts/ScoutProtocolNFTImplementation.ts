import { waitForTransactionReceipt } from '@packages/blockchain/waitForTransactionReceipt';
import type {
  Abi,
  Account,
  Address,
  Chain,
  Client,
  PublicActions,
  PublicClient,
  RpcSchema,
  TransactionReceipt,
  Transport,
  WalletActions,
  WalletClient
} from 'viem';
import { encodeFunctionData, decodeFunctionResult, getAddress } from 'viem';

// ReadWriteWalletClient reflects a wallet client that has been extended with PublicActions
//  https://github.com/wevm/viem/discussions/1463#discussioncomment-7504732
type ReadWriteWalletClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined
> = Client<
  transport,
  chain,
  account,
  RpcSchema,
  PublicActions<transport, chain, account> & WalletActions<chain, account>
>;

export class ScoutProtocolNFTImplementationClient {
  public contractAddress: Address;

  private publicClient: PublicClient;

  private walletClient?: ReadWriteWalletClient;

  public abi: Abi = [
    {
      inputs: [],
      name: 'ERC20Token',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'acceptUpgrade',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'admin',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        }
      ],
      name: 'balanceOf',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address[]',
          name: 'accounts',
          type: 'address[]'
        },
        {
          internalType: 'uint256[]',
          name: 'tokenIds',
          type: 'uint256[]'
        }
      ],
      name: 'balanceOfBatch',
      outputs: [
        {
          internalType: 'uint256[]',
          name: '',
          type: 'uint256[]'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address'
        },
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
      name: 'burn',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        }
      ],
      name: 'getBuilderAddressForToken',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        }
      ],
      name: 'getBuilderIdForToken',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'getPriceIncrement',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'builderId',
          type: 'string'
        }
      ],
      name: 'getTokenIdForBuilder',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
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
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'operator',
          type: 'address'
        }
      ],
      name: 'isApprovedForAll',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'isPaused',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'maxSupplyPerToken',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address'
        },
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
      name: 'mint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address'
        },
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
      name: 'mintTo',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'minter',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'name',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'pause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'pauser',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'proceedsReceiver',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'builderId',
          type: 'string'
        },
        {
          internalType: 'address',
          name: 'account',
          type: 'address'
        }
      ],
      name: 'registerBuilderToken',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          internalType: 'uint256[]',
          name: 'tokenIds',
          type: 'uint256[]'
        },
        {
          internalType: 'uint256[]',
          name: 'amounts',
          type: 'uint256[]'
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes'
        }
      ],
      name: 'safeBatchTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes'
        }
      ],
      name: 'safeTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'operator',
          type: 'address'
        },
        {
          internalType: 'bool',
          name: 'approved',
          type: 'bool'
        }
      ],
      name: 'setApprovalForAll',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: '_prefix',
          type: 'string'
        },
        {
          internalType: 'string',
          name: '_suffix',
          type: 'string'
        }
      ],
      name: 'setBaseUri',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'newMaxSupply',
          type: 'uint256'
        }
      ],
      name: 'setMaxSupplyPerToken',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_minter',
          type: 'address'
        }
      ],
      name: 'setMinter',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_newPauser',
          type: 'address'
        }
      ],
      name: 'setPauser',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'receiver',
          type: 'address'
        }
      ],
      name: 'setProceedsReceiver',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes4',
          name: 'interfaceId',
          type: 'bytes4'
        }
      ],
      name: 'supportsInterface',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'pure',
      type: 'function'
    },
    {
      inputs: [],
      name: 'symbol',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '_tokenId',
          type: 'uint256'
        }
      ],
      name: 'tokenURI',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'totalBuilderTokens',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        }
      ],
      name: 'totalSupply',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_newAdmin',
          type: 'address'
        }
      ],
      name: 'transferAdmin',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'unPause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        },
        {
          internalType: 'address',
          name: 'newAddress',
          type: 'address'
        }
      ],
      name: 'updateBuilderTokenAddress',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'newIncrement',
          type: 'uint256'
        }
      ],
      name: 'updatePriceIncrement',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '_tokenId',
          type: 'uint256'
        }
      ],
      name: 'uri',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'account',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'operator',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'bool',
          name: 'approved',
          type: 'bool'
        }
      ],
      name: 'ApprovalForAll',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'previousAddress',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newAddress',
          type: 'address'
        }
      ],
      name: 'BuilderAddressUpdated',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'previousMaxSupply',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'newMaxSupply',
          type: 'uint256'
        }
      ],
      name: 'MaxSupplyPerTokenSet',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousMinter',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newMinter',
          type: 'address'
        }
      ],
      name: 'MinterSet',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: '_callerAddress',
          type: 'address'
        }
      ],
      name: 'Paused',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'previousIncrement',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'newIncrement',
          type: 'uint256'
        }
      ],
      name: 'PriceIncrementUpdated',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousReceiver',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newReceiver',
          type: 'address'
        }
      ],
      name: 'ProceedsReceiverSet',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'string',
          name: 'roleName',
          type: 'string'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'previousHolder',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newHolder',
          type: 'address'
        }
      ],
      name: 'RoleTransferred',
      type: 'event'
    },
    {
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
          internalType: 'string',
          name: 'builderId',
          type: 'string'
        }
      ],
      name: 'TokenRegistered',
      type: 'event'
    },
    {
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
          internalType: 'uint256[]',
          name: 'ids',
          type: 'uint256[]'
        },
        {
          indexed: false,
          internalType: 'uint256[]',
          name: 'values',
          type: 'uint256[]'
        }
      ],
      name: 'TransferBatch',
      type: 'event'
    },
    {
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
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'string',
          name: 'value',
          type: 'string'
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'id',
          type: 'uint256'
        }
      ],
      name: 'URI',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: '_callerAddress',
          type: 'address'
        }
      ],
      name: 'Unpaused',
      type: 'event'
    }
  ];

  constructor({
    contractAddress,
    publicClient,
    walletClient
  }: {
    contractAddress: Address;
    publicClient?: PublicClient;
    walletClient?: ReadWriteWalletClient;
  }) {
    if (!publicClient && !walletClient) {
      throw new Error('At least one client is required.');
    }

    this.contractAddress = contractAddress;

    const client = publicClient || walletClient;

    if (publicClient) {
      this.publicClient = publicClient;
    } else {
      this.walletClient = walletClient;
      this.publicClient = walletClient as PublicClient;
    }
  }

  async ERC20Token(params: { blockNumber?: bigint } = {}): Promise<Address> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'ERC20Token',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'ERC20Token',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as Address;
  }

  async acceptUpgrade(params: { blockNumber?: bigint } = {}): Promise<Address> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'acceptUpgrade',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'acceptUpgrade',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as Address;
  }

  async admin(params: { blockNumber?: bigint } = {}): Promise<Address> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'admin',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'admin',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as Address;
  }

  async balanceOf(params: { args: { account: Address; tokenId: bigint }; blockNumber?: bigint }): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'balanceOf',
      args: [params.args.account, params.args.tokenId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'balanceOf',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint;
  }

  async balanceOfBatch(params: {
    args: { accounts: Address[]; tokenIds: bigint[] };
    blockNumber?: bigint;
  }): Promise<bigint[]> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'balanceOfBatch',
      args: [params.args.accounts, params.args.tokenIds]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'balanceOfBatch',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint[];
  }

  async burn(params: {
    args: { account: Address; tokenId: bigint; amount: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'burn',
      args: [params.args.account, params.args.tokenId, params.args.amount]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async getBuilderAddressForToken(params: { args: { tokenId: bigint }; blockNumber?: bigint }): Promise<Address> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'getBuilderAddressForToken',
      args: [params.args.tokenId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'getBuilderAddressForToken',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as Address;
  }

  async getBuilderIdForToken(params: { args: { tokenId: bigint }; blockNumber?: bigint }): Promise<string> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'getBuilderIdForToken',
      args: [params.args.tokenId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'getBuilderIdForToken',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as string;
  }

  async getPriceIncrement(params: { blockNumber?: bigint } = {}): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'getPriceIncrement',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'getPriceIncrement',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint;
  }

  async getTokenIdForBuilder(params: { args: { builderId: string }; blockNumber?: bigint }): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'getTokenIdForBuilder',
      args: [params.args.builderId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'getTokenIdForBuilder',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint;
  }

  async getTokenPurchasePrice(params: {
    args: { tokenId: bigint; amount: bigint };
    blockNumber?: bigint;
  }): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'getTokenPurchasePrice',
      args: [params.args.tokenId, params.args.amount]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'getTokenPurchasePrice',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint;
  }

  async isApprovedForAll(params: {
    args: { account: Address; operator: Address };
    blockNumber?: bigint;
  }): Promise<boolean> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'isApprovedForAll',
      args: [params.args.account, params.args.operator]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'isApprovedForAll',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as boolean;
  }

  async isPaused(params: { blockNumber?: bigint } = {}): Promise<boolean> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'isPaused',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'isPaused',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as boolean;
  }

  async maxSupplyPerToken(params: { blockNumber?: bigint } = {}): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'maxSupplyPerToken',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'maxSupplyPerToken',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint;
  }

  async mint(params: {
    args: { account: Address; tokenId: bigint; amount: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'mint',
      args: [params.args.account, params.args.tokenId, params.args.amount]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async mintTo(params: {
    args: { account: Address; tokenId: bigint; amount: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'mintTo',
      args: [params.args.account, params.args.tokenId, params.args.amount]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async minter(params: { blockNumber?: bigint } = {}): Promise<Address> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'minter',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'minter',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as Address;
  }

  async name(params: { blockNumber?: bigint } = {}): Promise<string> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'name',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'name',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as string;
  }

  async pause(params: { value?: bigint; gasPrice?: bigint }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'pause',
      args: []
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async pauser(params: { blockNumber?: bigint } = {}): Promise<Address> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'pauser',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'pauser',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as Address;
  }

  async proceedsReceiver(params: { blockNumber?: bigint } = {}): Promise<Address> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'proceedsReceiver',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'proceedsReceiver',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as Address;
  }

  async registerBuilderToken(params: {
    args: { builderId: string; account: Address };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'registerBuilderToken',
      args: [params.args.builderId, params.args.account]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async safeBatchTransferFrom(params: {
    args: { from: Address; to: Address; tokenIds: bigint[]; amounts: bigint[]; data: string };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'safeBatchTransferFrom',
      args: [params.args.from, params.args.to, params.args.tokenIds, params.args.amounts, params.args.data]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async safeTransferFrom(params: {
    args: { from: Address; to: Address; tokenId: bigint; amount: bigint; data: string };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'safeTransferFrom',
      args: [params.args.from, params.args.to, params.args.tokenId, params.args.amount, params.args.data]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async setApprovalForAll(params: {
    args: { operator: Address; approved: boolean };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'setApprovalForAll',
      args: [params.args.operator, params.args.approved]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async setBaseUri(params: {
    args: { _prefix: string; _suffix: string };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'setBaseUri',
      args: [params.args._prefix, params.args._suffix]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async setMaxSupplyPerToken(params: {
    args: { newMaxSupply: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'setMaxSupplyPerToken',
      args: [params.args.newMaxSupply]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async setMinter(params: {
    args: { _minter: Address };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'setMinter',
      args: [params.args._minter]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async setPauser(params: {
    args: { _newPauser: Address };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'setPauser',
      args: [params.args._newPauser]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async setProceedsReceiver(params: {
    args: { receiver: Address };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'setProceedsReceiver',
      args: [params.args.receiver]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async supportsInterface(params: { args: { interfaceId: string }; blockNumber?: bigint }): Promise<boolean> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'supportsInterface',
      args: [params.args.interfaceId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'supportsInterface',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as boolean;
  }

  async symbol(params: { blockNumber?: bigint } = {}): Promise<string> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'symbol',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'symbol',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as string;
  }

  async tokenURI(params: { args: { _tokenId: bigint }; blockNumber?: bigint }): Promise<string> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'tokenURI',
      args: [params.args._tokenId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'tokenURI',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as string;
  }

  async totalBuilderTokens(params: { blockNumber?: bigint } = {}): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'totalBuilderTokens',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'totalBuilderTokens',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint;
  }

  async totalSupply(params: { args: { tokenId: bigint }; blockNumber?: bigint }): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'totalSupply',
      args: [params.args.tokenId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'totalSupply',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint;
  }

  async transferAdmin(params: {
    args: { _newAdmin: Address };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'transferAdmin',
      args: [params.args._newAdmin]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async unPause(params: { value?: bigint; gasPrice?: bigint }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'unPause',
      args: []
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async updateBuilderTokenAddress(params: {
    args: { tokenId: bigint; newAddress: Address };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'updateBuilderTokenAddress',
      args: [params.args.tokenId, params.args.newAddress]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async updatePriceIncrement(params: {
    args: { newIncrement: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'updatePriceIncrement',
      args: [params.args.newIncrement]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    // Return the transaction receipt
    return waitForTransactionReceipt(this.publicClient, tx);
  }

  async uri(params: { args: { _tokenId: bigint }; blockNumber?: bigint }): Promise<string> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'uri',
      args: [params.args._tokenId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'uri',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as string;
  }
}
