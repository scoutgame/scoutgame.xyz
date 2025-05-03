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
export type ReadWriteWalletClient<
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

export class ScoutProtocolImplementationClient {
  public contractAddress: Address;

  private publicClient: PublicClient;

  private walletClient?: ReadWriteWalletClient;

  public abi: Abi = [
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
          components: [
            {
              internalType: 'string',
              name: 'week',
              type: 'string'
            },
            {
              internalType: 'uint256',
              name: 'amount',
              type: 'uint256'
            },
            {
              internalType: 'bytes32[]',
              name: 'proofs',
              type: 'bytes32[]'
            }
          ],
          internalType: 'struct ScoutProtocolImplementation.Claim',
          name: 'claimData',
          type: 'tuple'
        }
      ],
      name: 'claim',
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
      name: 'claimsManager',
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
          name: 'week',
          type: 'string'
        }
      ],
      name: 'getWeeklyMerkleRoot',
      outputs: [
        {
          components: [
            {
              internalType: 'string',
              name: 'isoWeek',
              type: 'string'
            },
            {
              internalType: 'uint256',
              name: 'validUntil',
              type: 'uint256'
            },
            {
              internalType: 'bytes32',
              name: 'merkleRoot',
              type: 'bytes32'
            },
            {
              internalType: 'string',
              name: 'merkleTreeUri',
              type: 'string'
            }
          ],
          internalType: 'struct ScoutProtocolImplementation.WeeklyMerkleRoot',
          name: '',
          type: 'tuple'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'week',
          type: 'string'
        },
        {
          internalType: 'address',
          name: 'account',
          type: 'address'
        }
      ],
      name: 'hasClaimed',
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
      inputs: [
        {
          components: [
            {
              internalType: 'string',
              name: 'week',
              type: 'string'
            },
            {
              internalType: 'uint256',
              name: 'amount',
              type: 'uint256'
            },
            {
              internalType: 'bytes32[]',
              name: 'proofs',
              type: 'bytes32[]'
            }
          ],
          internalType: 'struct ScoutProtocolImplementation.Claim[]',
          name: 'claims',
          type: 'tuple[]'
        }
      ],
      name: 'multiClaim',
      outputs: [],
      stateMutability: 'nonpayable',
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
      name: 'scoutTokenERC20',
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
        }
      ],
      name: 'setClaimsManager',
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
          name: 'token',
          type: 'address'
        }
      ],
      name: 'setScoutTokenERC20',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: 'string',
              name: 'isoWeek',
              type: 'string'
            },
            {
              internalType: 'uint256',
              name: 'validUntil',
              type: 'uint256'
            },
            {
              internalType: 'bytes32',
              name: 'merkleRoot',
              type: 'bytes32'
            },
            {
              internalType: 'string',
              name: 'merkleTreeUri',
              type: 'string'
            }
          ],
          internalType: 'struct ScoutProtocolImplementation.WeeklyMerkleRoot',
          name: 'weeklyRoot',
          type: 'tuple'
        }
      ],
      name: 'setWeeklyMerkleRoot',
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
          name: 'user',
          type: 'address'
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
          name: 'week',
          type: 'string'
        },
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'merkleRoot',
          type: 'bytes32'
        }
      ],
      name: 'TokensClaimed',
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
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'string',
          name: 'week',
          type: 'string'
        },
        {
          indexed: false,
          internalType: 'bytes32',
          name: 'merkleRoot',
          type: 'bytes32'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'validUntil',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'string',
          name: 'merkleTreeUri',
          type: 'string'
        }
      ],
      name: 'WeeklyMerkleRootSet',
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

  async claim(params: { args: { claimData: any }; value?: bigint; gasPrice?: bigint }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'claim',
      args: [params.args.claimData]
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

  async claimsManager(params: { blockNumber?: bigint } = {}): Promise<Address> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'claimsManager',
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
      functionName: 'claimsManager',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as Address;
  }

  async getWeeklyMerkleRoot(params: { args: { week: string }; blockNumber?: bigint }): Promise<any> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'getWeeklyMerkleRoot',
      args: [params.args.week]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'getWeeklyMerkleRoot',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as any;
  }

  async hasClaimed(params: { args: { week: string; account: Address }; blockNumber?: bigint }): Promise<boolean> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'hasClaimed',
      args: [params.args.week, params.args.account]
    });

    const { data } = await this.publicClient.call({
      to: this.contractAddress,
      data: txData,
      blockNumber: params.blockNumber
    });

    // Decode the result based on the expected return type
    const result = decodeFunctionResult({
      abi: this.abi,
      functionName: 'hasClaimed',
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

  async multiClaim(params: { args: { claims: any }; value?: bigint; gasPrice?: bigint }): Promise<Address> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'multiClaim',
      args: [params.args.claims]
    });

    const txInput: Omit<Parameters<WalletClient['sendTransaction']>[0], 'account' | 'chain'> = {
      to: getAddress(this.contractAddress),
      data: txData,
      value: params.value ?? BigInt(0), // Optional value for payable methods
      gasPrice: params.gasPrice // Optional gasPrice
    };

    // This is necessary because the wallet client requires account and chain, which actually cause writes to throw
    const tx = await this.walletClient.sendTransaction(txInput as any);

    return tx;
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

  async scoutTokenERC20(params: { blockNumber?: bigint } = {}): Promise<Address> {
    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'scoutTokenERC20',
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
      functionName: 'scoutTokenERC20',
      data: data as `0x${string}`
    });

    // Parse the result based on the return type
    return result as Address;
  }

  async setClaimsManager(params: {
    args: { account: Address };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'setClaimsManager',
      args: [params.args.account]
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

  async setScoutTokenERC20(params: {
    args: { token: Address };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'setScoutTokenERC20',
      args: [params.args.token]
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

  async setWeeklyMerkleRoot(params: {
    args: { weeklyRoot: any };
    value?: bigint;
    gasPrice?: bigint;
  }): Promise<TransactionReceipt> {
    if (!this.walletClient) {
      throw new Error('Wallet client is required for write operations.');
    }

    const txData = encodeFunctionData({
      abi: this.abi,
      functionName: 'setWeeklyMerkleRoot',
      args: [params.args.weeklyRoot]
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
