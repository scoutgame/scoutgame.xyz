import { SchemaRegistry, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

export const NULL_EAS_REF_UID = '0x0000000000000000000000000000000000000000000000000000000000000000';

export const NULL_EVM_ADDRESS = '0x0000000000000000000000000000000000000000';

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
