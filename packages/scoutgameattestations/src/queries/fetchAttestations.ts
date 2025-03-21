// Import direct from index.js necessary to avoid a bug with jest
// https://github.com/apollographql/apollo-feature-requests/issues/287#issuecomment-1192993207
import { gql } from '@apollo/client/core/index.js';
import type { ISOWeek } from '@packages/dates/config';
import { getSeasonStartEndSecondTimestamps, getWeekStartEndSecondTimestamps } from '@packages/dates/utils';

import {
  scoutGameBuilderEventSchemaUid,
  scoutGameContributionReceiptSchemaUid,
  scoutGameUserProfileSchemaUid
} from '../constants';
import type { AttestationContentFromAttestationType, AttestationType } from '../easSchemas';
import { decodeAttestation } from '../easSchemas';
import type { EASSchemaChain } from '../easSchemas/constants';

import { getEasGraphQlClient } from './graphql';

type QueryAttestationData = {
  id: string;
  revoked: boolean;
  timeCreated: number;
  data: `0x${string}`;
  refUID: `0x${string}`;
};

export type QueryResult = {
  attestations: QueryAttestationData[];
};

export type ScoutGameAttestation<T extends AttestationType = AttestationType> = Pick<
  QueryAttestationData,
  'id' | 'revoked' | 'timeCreated' | 'refUID'
> & {
  type: T;
  content: AttestationContentFromAttestationType[T];
};

export async function fetchAttestations<T extends AttestationType = AttestationType>({
  week,
  season,
  chainId,
  type,
  userRefUID
}: {
  week?: ISOWeek;
  season?: ISOWeek;
  chainId: EASSchemaChain;
  type: T;
  userRefUID?: `0x${string}`;
}): Promise<ScoutGameAttestation<T>[]> {
  if (week && season) {
    throw new Error('Cannot provide both week and season');
  }

  const schemaId =
    type === 'contributionReceipt'
      ? scoutGameContributionReceiptSchemaUid()
      : type === 'developerStatusEvent'
        ? scoutGameBuilderEventSchemaUid()
        : type === 'userProfile'
          ? scoutGameUserProfileSchemaUid()
          : null;

  if (!schemaId) {
    throw new Error(`No schemaId found for type: ${type}`);
  }

  const dateRange = week
    ? getWeekStartEndSecondTimestamps(week)
    : season
      ? getSeasonStartEndSecondTimestamps(season)
      : undefined;

  const client = getEasGraphQlClient({ chainId });

  async function queryData({ take, skip }: { take: number; skip: number }) {
    const { data } = await client.query<QueryResult>({
      query: gql`
        query ($where: AttestationWhereInput) {
          attestations(where: $where, orderBy: { timeCreated: asc }, take: ${take}, skip: ${skip}) {
            id
            # data
            timeCreated
            data
            refUID
            # time
          }
        }
      `,
      variables: {
        where: {
          refUID: userRefUID ? { equals: userRefUID } : undefined,
          isOffchain: {
            equals: false
          },
          schemaId: {
            equals: schemaId
          },
          timeCreated: dateRange
            ? {
                gte: dateRange.start,
                lte: dateRange.end
              }
            : undefined
        }
      }
    });

    return data;
  }

  const take = 100;

  async function fetchAllData(currentResults: QueryAttestationData[] = []): Promise<QueryAttestationData[]> {
    const data = await queryData({ take, skip: currentResults.length });

    const newResults = [...currentResults, ...data.attestations];

    if (!data?.attestations?.length || data.attestations.length < take) {
      return newResults;
    }
    return fetchAllData(newResults);
  }

  const results = await fetchAllData();

  return results.map((attestation) => ({
    ...attestation,
    type,
    content: decodeAttestation({ rawData: attestation.data, type })
  }));
}
