import { log } from '@charmverse/core/log';
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

export class BuilderNFTSeasonOneImplementation01Client {
  private contractAddress: Address;

  private publicClient: PublicClient;

  private walletClient?: ReadWriteWalletClient;

  private chain: Chain;

  public abi = [
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'id',
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
          internalType: 'string',
          name: 'scout',
          type: 'string'
        }
      ],
      name: 'mintTo',
      outputs: [],
      stateMutability: 'nonpayable',
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
      name: 'registerBuilderToken',
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
      name: 'tokenURI',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string'
        }
      ],
      stateMutability: 'pure',
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
      inputs: [],
      name: 'getProceedsReceiver',
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
      name: 'getMinter',
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
    }
  ] as const;

  constructor({
    contractAddress,
    publicClient,
    walletClient,
    chain
  }: {
    contractAddress: Address;
    chain: Chain;
    publicClient?: PublicClient;
    walletClient?: ReadWriteWalletClient;
  }) {
    if (!publicClient && !walletClient) {
      throw new Error('At least one client is required.');
    } else if (publicClient && walletClient) {
      throw new Error('Provide only a public client or wallet clients');
    }

    this.chain = chain;
    this.contractAddress = contractAddress;

    const client = publicClient || walletClient;

    if (client!.chain!.id !== chain.id) {
      throw new Error('Client must be on the same chain as the contract. Make sure to add a chain to your client');
    }

    if (publicClient) {
      this.publicClient = publicClient;
    } else {
      this.walletClient = walletClient;
      this.publicClient = walletClient as PublicClient;
    }
  }

  async balanceOf(params: { args: { account: string; id: bigint } }): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'balanceOf',
      args: [params.args.account as Address, params.args.id]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData
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

  async getBuilderIdForToken(params: { args: { tokenId: bigint } }): Promise<string> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'getBuilderIdForToken',
      args: [params.args.tokenId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData
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

  async getMinter(): Promise<string> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'getMinter',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'getMinter',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as string;
  }

  async getPriceIncrement(): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'getPriceIncrement',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData
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

  async getTokenIdForBuilder(params: { args: { builderId: string } }): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'getTokenIdForBuilder',
      args: [params.args.builderId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData
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

  async mintTo(params: {
    args: { account: string; tokenId: bigint; amount: bigint; scout: string };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'mintTo',
      args: [params.args.account as Address, params.args.tokenId, params.args.amount, params.args.scout]
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
    const receipt = await this.walletClient.waitForTransactionReceipt({ hash: tx });

    log.info('Minted NFT via admin wallet', { params });

    return receipt;
  }

  async registerBuilderToken(params: {
    args: { builderId: string };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'registerBuilderToken',
      args: [params.args.builderId]
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
    return this.walletClient.waitForTransactionReceipt({ hash: tx });
  }

  async tokenURI(params: { args: { _tokenId: bigint } }): Promise<string> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'tokenURI',
      args: [params.args._tokenId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData
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

  async totalBuilderTokens(): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'totalBuilderTokens',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData
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

  async totalSupply(params: { args: { tokenId: bigint } }): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'totalSupply',
      args: [params.args.tokenId]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData
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

  async getProceedsReceiver(): Promise<string> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'getProceedsReceiver',
      args: []
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'getProceedsReceiver',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as string;
  }
}
