import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import type { BuilderStatusEventType } from '@prisma/client';

import type { EASSchema } from './types';

const developerStatusEventEASSchema = 'string description,string type,string season';

const developerStatusEventSchemaName = 'Scout Game Developer Status Event';

export const developerStatusEventSchemaDefinition = {
  schema: developerStatusEventEASSchema,
  name: developerStatusEventSchemaName
} as const satisfies EASSchema;

export type DeveloperStatusEventAttestation = {
  description: string;
  type: BuilderStatusEventType;
  season: string;
};

const encoder = new SchemaEncoder(developerStatusEventEASSchema);

export function encodeDeveloperStatusEventAttestation(attestation: DeveloperStatusEventAttestation): `0x${string}` {
  const encodedData = encoder.encodeData([
    { name: 'description', type: 'string', value: attestation.description },
    { name: 'type', type: 'string', value: attestation.type },
    { name: 'season', type: 'string', value: attestation.season }
  ]);

  return encodedData as `0x${string}`;
}

export function decodeDeveloperStatusEventAttestation(rawData: string): DeveloperStatusEventAttestation {
  const parsed = encoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    const key = item.name as keyof DeveloperStatusEventAttestation;

    if (key === 'type') {
      acc[key] = item.value.value as BuilderStatusEventType;
    } else {
      acc[key] = item.value.value as string;
    }
    return acc;
  }, {} as DeveloperStatusEventAttestation);

  return values as DeveloperStatusEventAttestation;
}
