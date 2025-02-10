import { gql } from '@apollo/client';
import type { ISOWeek } from '@packages/dates/config';
import { getWeekStartEndSecondTimestamps } from '@packages/dates/utils';

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

type QueryResult = {
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
  chainId,
  type,
  userRefUID
}: {
  week: ISOWeek;
  chainId: EASSchemaChain;
  type: T;
  userRefUID?: `0x${string}`;
}): Promise<ScoutGameAttestation<T>[]> {
  const schemaId =
    type === 'contributionReceipt'
      ? scoutGameContributionReceiptSchemaUid()
      : type === 'builderEvent'
        ? scoutGameBuilderEventSchemaUid()
        : scoutGameUserProfileSchemaUid();

  const { start, end } = getWeekStartEndSecondTimestamps(week);

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
          AND: [
            {
              timeCreated: {
                lte: end
              }
            },
            {
              timeCreated: {
                gte: start
              }
            }
          ]
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

// fetchAttestations({
//   week: '2025-W01',
//   chainId: 84532,
//   type: 'contributionReceipt'
//   // userRefUID: '0x54ceda008195aac52000bd9d560b65dc3e69fcb4425735448d58a33b94f29333'
// }).then((data) => {
//   console.log(data.length);
// });
