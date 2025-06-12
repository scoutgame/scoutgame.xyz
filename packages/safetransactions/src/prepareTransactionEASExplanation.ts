import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { transactionInfoAttestationSchemaUid } from '@packages/scoutgameattestations/constants';
import { OperationType } from '@safe-global/types-kit';
import { encodeFunctionData } from 'viem';

const EAS_ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'schema',
            type: 'bytes32'
          },
          {
            components: [
              {
                internalType: 'address',
                name: 'recipient',
                type: 'address'
              },
              {
                internalType: 'uint64',
                name: 'expirationTime',
                type: 'uint64'
              },
              {
                internalType: 'bool',
                name: 'revocable',
                type: 'bool'
              },
              {
                internalType: 'bytes32',
                name: 'refUID',
                type: 'bytes32'
              },
              {
                internalType: 'bytes',
                name: 'data',
                type: 'bytes'
              },
              {
                internalType: 'uint256',
                name: 'value',
                type: 'uint256'
              }
            ],
            internalType: 'struct AttestationRequestData',
            name: 'data',
            type: 'tuple'
          }
        ],
        internalType: 'struct AttestationRequest',
        name: 'request',
        type: 'tuple'
      }
    ],
    name: 'attest',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  }
];

/**
 * To avoid installing EAS for now, we use this function to convert a string to the format expected by EAS and conforming to the "string transactionInfo" schema.
 */
function stringToBytes(str: string): `0x${string}` {
  // Encode according to EAS schema format for string
  // First 32 bytes are offset to string data
  // Next 32 bytes are string length
  // Followed by string data padded to 32 byte boundary
  const stringBytes = Buffer.from(str, 'utf8');
  const stringLength = stringBytes.length;

  // Calculate total length including padding
  const paddedLength = Math.ceil(stringLength / 32) * 32;

  // Create buffer for full encoded data
  const fullData = Buffer.alloc(64 + paddedLength);

  // Write offset (32) as first 32 bytes
  fullData.write('0000000000000000000000000000000000000000000000000000000000000020', 0, 'hex');

  // Write string length as next 32 bytes
  fullData.write(stringLength.toString(16).padStart(64, '0'), 32, 'hex');

  // Write string data
  fullData.set(stringBytes, 64);

  return `0x${fullData.toString('hex')}`;
}

export function prepareTransactionExplanation({ justificationText }: { justificationText: string }) {
  // Prepare the arguments for the EAS .attest(...) call:
  const easCallArgs = [
    {
      schema: transactionInfoAttestationSchemaUid,
      data: {
        recipient: NULL_EVM_ADDRESS,
        expirationTime: BigInt(0),
        revocable: false,
        refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
        data: stringToBytes(justificationText),
        value: BigInt(0)
      }
    }
  ];

  const encodedEasData = encodeFunctionData({
    abi: EAS_ABI,
    functionName: 'attest',
    args: easCallArgs
  });

  // This is the MetaTransactionData for Safe or Gnosis multi-call
  const txData = {
    to: '0x4200000000000000000000000000000000000021',
    data: encodedEasData,
    value: '0',
    operation: OperationType.Call
  };

  return txData;
}
