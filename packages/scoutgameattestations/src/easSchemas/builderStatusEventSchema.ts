import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import type { BuilderStatusEventType } from '@prisma/client';

import type { EASSchema } from './types';

const builderStatusEventEASSchema = 'string description,string type,string season';

const builderStatusEventSchemaName = 'Scout Game Builder Status Event';

export const builderStatusEventSchemaDefinition = {
  schema: builderStatusEventEASSchema,
  name: builderStatusEventSchemaName
} as const satisfies EASSchema;

export type BuilderStatusEventAttestation = {
  description: string;
  type: BuilderStatusEventType;
  season: string;
};

const encoder = new SchemaEncoder(builderStatusEventEASSchema);

export function encodeBuilderStatusEventAttestation(attestation: BuilderStatusEventAttestation): `0x${string}` {
  const encodedData = encoder.encodeData([
    { name: 'description', type: 'string', value: attestation.description },
    { name: 'type', type: 'string', value: attestation.type },
    { name: 'season', type: 'string', value: attestation.season }
  ]);

  return encodedData as `0x${string}`;
}

export function decodeBuilderStatusEventAttestation(rawData: string): BuilderStatusEventAttestation {
  const parsed = encoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    const key = item.name as keyof BuilderStatusEventAttestation;

    if (key === 'type') {
      acc[key] = item.value.value as BuilderStatusEventType;
    } else {
      acc[key] = item.value.value as string;
    }
    return acc;
  }, {} as BuilderStatusEventAttestation);

  return values as BuilderStatusEventAttestation;
}
