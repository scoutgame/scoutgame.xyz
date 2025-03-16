

import { log } from '@charmverse/core/log';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import type { Address } from 'viem';
import { isAddress, parseEventLogs } from 'viem';
import { easConfig, EASSchemaChain, encodeNameSchemaAttestation } from '../easSchemas/constants';
import { allSchemas, EASSchemaNames } from '../easSchemas/index';

import { NAME_SCHEMA_UID, NULL_EAS_REF_UID } from '../easSchemas/constants';

const PRIVATE_KEY = (
  process.env.PRIVATE_KEY?.startsWith('0x') ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`
) as `0x${string}`;


const registerSchemaAbi = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "schema",
        "type": "string"
      },
      {
        "internalType": "contract ISchemaResolver",
        "name": "resolver",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "revocable",
        "type": "bool"
      }
    ],
    "name": "register",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "uid",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "registerer",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "uid",
            "type": "bytes32"
          },
          {
            "internalType": "contract ISchemaResolver",
            "name": "resolver",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "revocable",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "schema",
            "type": "string"
          }
        ],
        "indexed": false,
        "internalType": "struct SchemaRecord",
        "name": "schema",
        "type": "tuple"
      }
    ],
    "name": "Registered",
    "type": "event"
  }
] as const;

const easAttestationAbi = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "schema",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
              },
              {
                "internalType": "uint64",
                "name": "expirationTime",
                "type": "uint64"
              },
              {
                "internalType": "bool",
                "name": "revocable",
                "type": "bool"
              },
              {
                "internalType": "bytes32",
                "name": "refUID",
                "type": "bytes32"
              },
              {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct AttestationRequestData",
            "name": "data",
            "type": "tuple"
          }
        ],
        "internalType": "struct AttestationRequest",
        "name": "request",
        "type": "tuple"
      }
    ],
    "name": "attest",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;


async function deployEASSchemas({chainId, resolverAddress, selectedSchemas}: {chainId: EASSchemaChain; resolverAddress: Address, selectedSchemas?: EASSchemaNames[]}) {
  const deployConfig = easConfig[chainId];

  const {chain, easContractAddress, easSchemaRegistryAddress} = deployConfig;

  if (!isAddress(resolverAddress)) {
    throw new Error(`Invalid EAS Contract address`);
  }

  const EAS_CONTRACT_ADDRESS = easContractAddress;


  const walletClient = getWalletClient({
    chainId,
    privateKey: PRIVATE_KEY,
  });

  if (!walletClient.account) {
    throw new Error('No account found');
  }

  const deployerAddress = walletClient.account.address;

  log.info('Using account:', deployerAddress, 'on chain:', chain.name);

  if (!isAddress(EAS_CONTRACT_ADDRESS)) {
    throw new Error(`Invalid EAS Contract address`);
  }


  for (const { schema, name } of allSchemas) {

    // Allows us to deploy schemas selectively
    if (selectedSchemas && !selectedSchemas.includes(name)) {
      continue;
    }

    const registerTx = await walletClient.writeContract({
      abi: registerSchemaAbi,
      functionName: 'register',
      args: [schema, resolverAddress, true],
      address: easSchemaRegistryAddress
    });

    const registerReceipt = await walletClient.waitForTransactionReceipt({ hash: registerTx });

    const logs = parseEventLogs({
      abi: registerSchemaAbi,
      logs: registerReceipt.logs,
      eventName: ['Registered']
    });

    const schemaId = logs[0].args.schema.uid;

    console.log(`Schema "${name}" registered with UID: ${schemaId}`);

    const data = encodeNameSchemaAttestation({ name, schemaId });

    const namingTx = await walletClient.writeContract({
      address: easContractAddress,
      abi: easAttestationAbi,
      functionName: 'attest',
      args: [{
        schema: NAME_SCHEMA_UID,
        data: {
          value: BigInt(0),
          revocable: true,
          recipient: NULL_EVM_ADDRESS,
          expirationTime: BigInt(0),
          refUID: NULL_EAS_REF_UID,
          data
        }
      }]
    });

    await walletClient.waitForTransactionReceipt({ hash: namingTx });
  }

  console.log('EAS Schemas deployed, view them on EAS');
  console.log(`https://base-sepolia.easscan.org/schemas`);
}


deployEASSchemas({
  chainId: 84532,
  resolverAddress: '0x0CF1faf544bF98b062995848cc03cC8714BBca52'
})