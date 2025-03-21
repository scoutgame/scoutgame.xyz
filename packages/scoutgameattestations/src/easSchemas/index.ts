import type { ContributionReceiptAttestation } from './contributionReceiptSchema';
import { contributionSchemaDefinition, decodeContributionReceiptAttestation } from './contributionReceiptSchema';
import type { DeveloperStatusEventAttestation } from './developerStatusEventSchema';
import {
  decodeDeveloperStatusEventAttestation,
  developerStatusEventSchemaDefinition
} from './developerStatusEventSchema';
import type { ScoutGameUserProfileAttestation } from './scoutGameUserProfileSchema';
import {
  decodeScoutGameUserProfileAttestation,
  scoutGameUserProfileSchemaDefinition
} from './scoutGameUserProfileSchema';
import type { EASSchema } from './types';

export * from './constants';
export * from './contributionReceiptSchema';
export * from './developerStatusEventSchema';
export * from './scoutGameUserProfileSchema';
export * from './types';

export const allSchemas = [
  contributionSchemaDefinition,
  scoutGameUserProfileSchemaDefinition,
  developerStatusEventSchemaDefinition
] satisfies EASSchema[];

export type EASSchemaNames = (typeof allSchemas)[number]['name'];

export type AttestationType = 'contributionReceipt' | 'developerStatusEvent' | 'userProfile';

export type AttestationContentFromAttestationType = {
  contributionReceipt: ContributionReceiptAttestation;
  developerStatusEvent: DeveloperStatusEventAttestation;
  userProfile: ScoutGameUserProfileAttestation;
};

export function decodeAttestation<T extends AttestationType = AttestationType>({
  rawData,
  type
}: {
  rawData: string;
  type: T;
}): AttestationContentFromAttestationType[T] {
  const schemaDecoder: Record<
    keyof AttestationContentFromAttestationType,
    (rawData: string) => AttestationContentFromAttestationType[keyof AttestationContentFromAttestationType]
  > = {
    contributionReceipt: decodeContributionReceiptAttestation,
    developerStatusEvent: decodeDeveloperStatusEventAttestation,
    userProfile: decodeScoutGameUserProfileAttestation
  };

  return schemaDecoder[type](rawData) as AttestationContentFromAttestationType[T];
}
