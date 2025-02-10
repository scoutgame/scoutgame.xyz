import type { BuilderStatusEventAttestation } from './builderStatusEventSchema';
import { builderStatusEventSchemaDefinition, decodeBuilderStatusEventAttestation } from './builderStatusEventSchema';
import type { ContributionReceiptAttestation } from './contributionReceiptSchema';
import { contributionSchemaDefinition, decodeContributionReceiptAttestation } from './contributionReceiptSchema';
import type { ScoutGameUserProfileAttestation } from './scoutGameUserProfileSchema';
import {
  decodeScoutGameUserProfileAttestation,
  scoutGameUserProfileSchemaDefinition
} from './scoutGameUserProfileSchema';
import type { EASSchema } from './types';

export * from './constants';
export * from './contributionReceiptSchema';
export * from './scoutGameUserProfileSchema';
export * from './builderStatusEventSchema';
export * from './types';

export const allSchemas = [
  contributionSchemaDefinition,
  scoutGameUserProfileSchemaDefinition,
  builderStatusEventSchemaDefinition
] satisfies EASSchema[];

export type EASSchemaNames = (typeof allSchemas)[number]['name'];

export type AttestationType = 'contributionReceipt' | 'builderStatusEvent' | 'userProfile';

export type AttestationContentFromAttestationType = {
  contributionReceipt: ContributionReceiptAttestation;
  builderStatusEvent: BuilderStatusEventAttestation;
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
    builderStatusEvent: decodeBuilderStatusEventAttestation,
    userProfile: decodeScoutGameUserProfileAttestation
  };

  return schemaDecoder[type](rawData) as AttestationContentFromAttestationType[T];
}
