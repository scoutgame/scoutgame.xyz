import { builderEventSchemaDefinition } from './builderStatusEventSchema';
import { contributionSchemaDefinition } from './contributionReceiptSchema';
import { scoutGameUserProfileSchemaDefinition } from './scoutGameUserProfileSchema';
import type { EASSchema } from './types';

export * from './constants';
export * from './contributionReceiptSchema';
export * from './scoutGameUserProfileSchema';
export * from './builderStatusEventSchema';
export * from './types';

export const allSchemas = [
  contributionSchemaDefinition,
  scoutGameUserProfileSchemaDefinition,
  builderEventSchemaDefinition
] satisfies EASSchema[];

export type EASSchemaNames = (typeof allSchemas)[number]['name'];
