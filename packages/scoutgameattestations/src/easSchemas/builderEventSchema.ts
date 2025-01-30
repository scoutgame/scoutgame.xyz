import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { EASSchema } from './types';

const builderEventEASSchema = 'string description,string type,string season';

const builderEventSchemaName = 'Scout Game Builder Event';

export const builderEventSchemaDefinition: EASSchema = {
  schema: builderEventEASSchema,
  name: builderEventSchemaName
};

export type BuilderEventAttestationType = 'registered' | 'banned' | 'unbanned';

export type BuilderEventAttestation = {
  description: string;
  type: BuilderEventAttestationType;
  season: string;
};

const encoder = new SchemaEncoder(builderEventEASSchema);

export function encodeBuilderEventAttestation(attestation: BuilderEventAttestation): `0x${string}` {
  const encodedData = encoder.encodeData([
    { name: 'description', type: 'string', value: attestation.description },
    { name: 'type', type: 'string', value: attestation.type },
    { name: 'season', type: 'string', value: attestation.season }
  ]);

  return encodedData as `0x${string}`;
}

export function decodeBuilderEventAttestation(rawData: string): BuilderEventAttestation {
  const parsed = encoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    const key = item.name as keyof BuilderEventAttestation;

    if (key === 'type') {
      acc[key] = item.value.value as BuilderEventAttestationType;
    } else {
      acc[key] = item.value.value as string;
    }
    return acc;
  }, {} as BuilderEventAttestation);

  return values as BuilderEventAttestation;
}
