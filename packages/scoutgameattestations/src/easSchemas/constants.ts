import { SchemaRegistry, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import type { Address } from 'viem';
import { optimism, optimismSepolia } from 'viem/chains';
import type { Chain } from 'viem/chains';

export const NULL_EAS_REF_UID = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

// This allows us to encode the schemaId and name of a name schema attestation
// Obtained from https://github.com/ethereum-attestation-service/eas-contracts/blob/558250dae4cb434859b1ac3b6d32833c6448be21/deploy/scripts/000004-name-initial-schemas.ts#L10C1-L11C1
export const NAME_SCHEMA_DEFINITION = 'bytes32 schemaId,string name';

export const NAME_SCHEMA_UID = SchemaRegistry.getSchemaUID(
  NAME_SCHEMA_DEFINITION,
  NULL_EVM_ADDRESS,
  true
) as `0x${string}`;

export type NameSchemaAttestation = {
  schemaId: `0x${string}`;
  name: string;
};

export function encodeNameSchemaAttestation({ name, schemaId }: NameSchemaAttestation): `0x${string}` {
  const encoder = new SchemaEncoder(NAME_SCHEMA_DEFINITION);

  return encoder.encodeData([
    { name: 'schemaId', type: 'bytes32', value: schemaId },
    { name: 'name', type: 'string', value: name }
  ]) as `0x${string}`;
}

export const easConfig = {
  [optimismSepolia.id]: {
    // Optimism Sepolia Testnet
    chain: optimismSepolia,
    easContractAddress: '0x4200000000000000000000000000000000000021',
    easSchemaRegistryAddress: '0x4200000000000000000000000000000000000020'
  },
  [optimism.id]: {
    // Optimism Mainnet
    chain: optimism,
    easContractAddress: '0x4200000000000000000000000000000000000021',
    easSchemaRegistryAddress: '0x4200000000000000000000000000000000000020'
  }
} satisfies Record<number, { chain: Chain; easContractAddress: Address; easSchemaRegistryAddress: Address }>;

export type EASSchemaChain = keyof typeof easConfig;

export const supportedEasChains = [optimismSepolia.id, optimism.id];
