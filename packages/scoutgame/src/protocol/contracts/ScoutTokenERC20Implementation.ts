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

export class ScoutTokenERC20ImplementationClient {
  public contractAddress: Address;

  private publicClient: PublicClient;

  private walletClient?: ReadWriteWalletClient;

  public abi: Abi = [
    {
      inputs: [],
      name: 'SUPPLY',
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
          name: 'owner',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'spender',
          type: 'address'
        }
      ],
      name: 'allowance',
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
          name: 'spender',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        }
      ],
      name: 'approve',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address'
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
          internalType: 'address',
          name: '_from',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: '_amount',
          type: 'uint256'
        }
      ],
      name: 'crosschainBurn',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_account',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: '_amount',
          type: 'uint256'
        }
      ],
      name: 'crosschainMint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'decimals',
      outputs: [
        {
          internalType: 'uint8',
          name: '',
          type: 'uint8'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'spender',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'subtractedValue',
          type: 'uint256'
        }
      ],
      name: 'decreaseAllowance',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'spender',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'addedValue',
          type: 'uint256'
        }
      ],
      name: 'increaseAllowance',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'initialize',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'isInitialized',
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
      name: 'l2Messenger',
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
      stateMutability: 'pure',
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
      inputs: [
        {
          internalType: 'address',
          name: '_l2Messenger',
          type: 'address'
        }
      ],
      name: 'setL2Messenger',
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
          name: '_superchainBridge',
          type: 'address'
        }
      ],
      name: 'setSuperchainBridge',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'superchainBridge',
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
          internalType: 'bytes4',
          name: '_interfaceId',
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
      stateMutability: 'pure',
      type: 'function'
    },
    {
      inputs: [],
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
          name: 'to',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        }
      ],
      name: 'transfer',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
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
          name: 'value',
          type: 'uint256'
        }
      ],
      name: 'transferFrom',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
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
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'spender',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        }
      ],
      name: 'Approval',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'from',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address'
        }
      ],
      name: 'CrosschainBurn',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address'
        }
      ],
      name: 'CrosschainMint',
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
          name: 'value',
          type: 'uint256'
        }
      ],
      name: 'Transfer',
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

  async SUPPLY(params: { blockNumber?: bigint } = {}): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'SUPPLY',
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
      functionName: 'SUPPLY',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint;
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

  async allowance(params: { args: { owner: Address; spender: Address }; blockNumber?: bigint }): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'allowance',
      args: [params.args.owner, params.args.spender]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'allowance',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint;
  }

  async approve(params: {
    args: { spender: Address; value: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'approve',
      args: [params.args.spender, params.args.value]
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

  async balanceOf(params: { args: { account: Address }; blockNumber?: bigint }): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'balanceOf',
      args: [params.args.account]
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

  async burn(params: { args: { amount: bigint }; value?: bigint; gasPrice?: bigint }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'burn',
      args: [params.args.amount]
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

  async crosschainBurn(params: {
    args: { _from: Address; _amount: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'crosschainBurn',
      args: [params.args._from, params.args._amount]
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

  async crosschainMint(params: {
    args: { _account: Address; _amount: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'crosschainMint',
      args: [params.args._account, params.args._amount]
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

  async decimals(params: { blockNumber?: bigint } = {}): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'decimals',
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
      functionName: 'decimals',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint;
  }

  async decreaseAllowance(params: {
    args: { spender: Address; subtractedValue: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'decreaseAllowance',
      args: [params.args.spender, params.args.subtractedValue]
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

  async increaseAllowance(params: {
    args: { spender: Address; addedValue: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'increaseAllowance',
      args: [params.args.spender, params.args.addedValue]
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

  async initialize(params: { value?: bigint; gasPrice?: bigint }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'initialize',
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

  async isInitialized(params: { blockNumber?: bigint } = {}): Promise<boolean> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'isInitialized',
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
      functionName: 'isInitialized',
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

  async l2Messenger(params: { blockNumber?: bigint } = {}): Promise<Address> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'l2Messenger',
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
      functionName: 'l2Messenger',
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

  async setL2Messenger(params: {
    args: { _l2Messenger: Address };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'setL2Messenger',
      args: [params.args._l2Messenger]
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

  async setSuperchainBridge(params: {
    args: { _superchainBridge: Address };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'setSuperchainBridge',
      args: [params.args._superchainBridge]
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

  async superchainBridge(params: { blockNumber?: bigint } = {}): Promise<Address> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'superchainBridge',
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
      functionName: 'superchainBridge',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as Address;
  }

  async supportsInterface(params: { args: { _interfaceId: string }; blockNumber?: bigint }): Promise<boolean> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'supportsInterface',
      args: [params.args._interfaceId]
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

  async totalSupply(params: { blockNumber?: bigint } = {}): Promise<bigint> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'totalSupply',
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
      functionName: 'totalSupply',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as bigint;
  }

  async transfer(params: {
    args: { to: Address; value: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'transfer',
      args: [params.args.to, params.args.value]
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

  async transferFrom(params: {
    args: { from: Address; to: Address; value: bigint };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'transferFrom',
      args: [params.args.from, params.args.to, params.args.value]
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
}
