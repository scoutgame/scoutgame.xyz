import { jest } from '@jest/globals';
import { encodeBuilderStatusEventAttestation } from '@packages/scoutgameattestations/easSchemas/builderStatusEventSchema';
import { encodeContributionReceiptAttestation } from '@packages/scoutgameattestations/easSchemas/contributionReceiptSchema';
import type { QueryResult } from '@packages/scoutgameattestations/queries/fetchAttestations';
import { getEasGraphQlClient } from '@packages/scoutgameattestations/queries/graphql';
import type { MockBuilder } from '@packages/testing/database';
import { mockBuilder } from '@packages/testing/database';
import { v4 as uuid } from 'uuid';
import { baseSepolia } from 'viem/chains';

import type { LeaderboardBuilder } from '../getBuildersLeaderboard';

type QueryVariables = {
  where: {
    refUID?: {
      equals: `0x${string}`;
    };
    schemaId: {
      equals: `0x${string}`;
    };
    timeCreated?: {
      gte: number;
      lte: number;
    };
  };
};

const mockGraphQlClient = {
  query: jest.fn() as jest.MockedFunction<
    (params: { query: any; variables: QueryVariables }) => Promise<{ data: QueryResult }>
  >
};

// jest.unstable_mockModule('@apollo/client', () => ({
//   ApolloClient: jest.fn().mockImplementation(() => mockGraphQlClient)
// }));

const userProfileSchema = '0xuser_profile_schema_uid';
const contributionReceiptSchema = '0xcontribution_receipt_schema_uid';
const builderEventSchema = '0xbuilder_event_schema_uid';

const scoutGameAttestationChainId = baseSepolia.id;

jest.unstable_mockModule('@packages/scoutgameattestations/constants', () => ({
  scoutGameUserProfileSchemaUid: () => userProfileSchema,
  scoutGameContributionReceiptSchemaUid: () => contributionReceiptSchema,
  scoutGameBuilderEventSchemaUid: () => builderEventSchema,
  scoutGameAttestationChainId
}));

jest.unstable_mockModule('@packages/scoutgameattestations/queries/graphql', () => ({
  getEasGraphQlClient: () => mockGraphQlClient
}));

const mockGetEasGraphQlClient = getEasGraphQlClient as jest.Mock;

const builder01OnchainProfileAttestationUid = '0xbuilder01';
const builder01Uuid = uuid();

const builder02OnchainProfileAttestationUid = '0xbuilder02';
const builder02Uuid = uuid();

const builder03OnchainProfileAttestationUid = '0xbuilder03';
const builder03Uuid = uuid();

describe('getBuildersLeaderboardFromEAS', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let getBuildersLeaderboardFromEAS: typeof import('../getBuildersLeaderboardFromEAS').getBuildersLeaderboardFromEAS;

  let builder01: MockBuilder;
  let builder02: MockBuilder;
  let builder03: MockBuilder;

  beforeAll(async () => {
    ({ getBuildersLeaderboardFromEAS } = await import('../getBuildersLeaderboardFromEAS'));

    builder01 = await mockBuilder({
      id: builder01Uuid,
      onchainProfileAttestationUid: builder01OnchainProfileAttestationUid,
      onchainProfileAttestationChainId: scoutGameAttestationChainId
    });

    builder02 = await mockBuilder({
      id: builder02Uuid,
      onchainProfileAttestationUid: builder02OnchainProfileAttestationUid,
      onchainProfileAttestationChainId: scoutGameAttestationChainId
    });

    builder03 = await mockBuilder({
      id: builder03Uuid,
      onchainProfileAttestationUid: builder03OnchainProfileAttestationUid,
      onchainProfileAttestationChainId: scoutGameAttestationChainId
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should compute leaderboard correctly with standard data', async () => {
    mockGraphQlClient.query.mockImplementation(({ variables }) => {
      const schemaId = variables.where.schemaId.equals;
      const userRefUID = variables.where.refUID?.equals;

      console.log(`Query`, {
        schemaId,
        userRefUID
      });

      if (schemaId === builderEventSchema) {
        return Promise.resolve({
          data: {
            attestations: [
              {
                id: '0x1',
                refUID: builder01OnchainProfileAttestationUid,
                data: encodeBuilderStatusEventAttestation({
                  description: 'Registered',
                  type: 'registered',
                  season: '2025-W01'
                }),
                timeCreated: 1,
                revoked: false
              },
              {
                id: '0x2',
                refUID: builder02OnchainProfileAttestationUid,
                data: encodeBuilderStatusEventAttestation({
                  description: 'Registered',
                  type: 'registered',
                  season: '2025-W01'
                }),
                timeCreated: 2,
                revoked: false
              }
            ]
          }
        }) as Promise<{ data: QueryResult }>;
      }
      if (schemaId === contributionReceiptSchema) {
        if (userRefUID === builder01OnchainProfileAttestationUid) {
          return Promise.resolve({
            data: {
              attestations: [
                {
                  id: '0x3',
                  refUID: builder01OnchainProfileAttestationUid,
                  data: encodeContributionReceiptAttestation({
                    value: 100,
                    description: 'Contribution',
                    type: 'contribution',
                    url: 'https://example.com',
                    metadataUrl: 'https://example.com/metadata'
                  }),
                  timeCreated: 3,
                  revoked: false
                },
                {
                  id: '0x4',
                  refUID: builder01OnchainProfileAttestationUid,
                  data: encodeContributionReceiptAttestation({
                    value: 200,
                    description: 'Contribution',
                    type: 'contribution',
                    url: 'https://example.com',
                    metadataUrl: 'https://example.com/metadata'
                  }),
                  timeCreated: 4,
                  revoked: false
                }
              ]
            }
          }) as Promise<{ data: QueryResult }>;
        }

        if (userRefUID === builder02OnchainProfileAttestationUid) {
          return Promise.resolve({
            data: {
              attestations: [
                {
                  id: '0x5',
                  refUID: builder02OnchainProfileAttestationUid,
                  data: encodeContributionReceiptAttestation({
                    value: 150,
                    description: 'Contribution',
                    type: 'contribution',
                    url: 'https://example.com',
                    metadataUrl: 'https://example.com/metadata'
                  }),
                  timeCreated: 5,
                  revoked: false
                }
              ]
            }
          }) as Promise<{ data: QueryResult }>;
        }
      }
      return Promise.resolve({ data: { attestations: [] } });
    });

    const result = await getBuildersLeaderboardFromEAS({ week: '2025-W01' });
    expect(result).toMatchObject<LeaderboardBuilder[]>([
      {
        builder: {
          displayName: builder01.displayName,
          id: builder01.id,
          path: builder01.path
        },
        gemsCollected: 300,
        rank: 1
      },
      {
        builder: {
          displayName: builder02.displayName,
          id: builder02.id,
          path: builder02.path
        },
        gemsCollected: 150,
        rank: 2
      }
    ]);
  });

  it('should handle no builders registered', async () => {
    mockGraphQlClient.query.mockResolvedValue({ data: { attestations: [] } });

    const result = await getBuildersLeaderboardFromEAS({ week: '2025-W01' });
    expect(result).toEqual([]);
  });

  it('should handle all builders banned', async () => {
    mockGraphQlClient.query.mockImplementation(({ query }) => {
      const queryString = query.loc.source.body;
      if (queryString.includes('builderStatusEvent')) {
        return Promise.resolve({
          data: {
            attestations: [
              { id: '1', refUID: '0x1', content: { type: 'registered' }, timeCreated: 1 },
              { id: '2', refUID: '0x1', content: { type: 'banned' }, timeCreated: 2 }
            ]
          }
        });
      }
      return Promise.resolve({ data: { attestations: [] } });
    });

    const result = await getBuildersLeaderboardFromEAS({ week: '2025-W01' });
    expect(result).toEqual([]);
  });

  it('should handle mixed status events', async () => {
    mockGraphQlClient.query.mockImplementation(({ query }) => {
      const queryString = query.loc.source.body;
      if (queryString.includes('builderStatusEvent')) {
        return Promise.resolve({
          data: {
            attestations: [
              { id: '1', refUID: '0x1', content: { type: 'registered' }, timeCreated: 1 },
              { id: '2', refUID: '0x1', content: { type: 'banned' }, timeCreated: 2 },
              { id: '3', refUID: '0x1', content: { type: 'unbanned' }, timeCreated: 3 }
            ]
          }
        });
      }
      if (queryString.includes('contributionReceipt')) {
        return Promise.resolve({
          data: {
            attestations: [{ id: '4', refUID: '0x1', content: { value: 100 }, revoked: false, timeCreated: 4 }]
          }
        });
      }
      return Promise.resolve({ data: { attestations: [] } });
    });

    const result = await getBuildersLeaderboardFromEAS({ week: '2025-W01' });
    expect(result).toEqual([{ builder: expect.any(Object), gemsCollected: 100, rank: 1 }]);
  });

  it('should skip revoked contributions', async () => {
    mockGraphQlClient.query.mockImplementation(({ query }) => {
      const queryString = query.loc.source.body;
      if (queryString.includes('builderStatusEvent')) {
        return Promise.resolve({
          data: {
            attestations: [{ id: '1', refUID: '0x1', content: { type: 'registered' }, timeCreated: 1 }]
          }
        });
      }
      if (queryString.includes('contributionReceipt')) {
        return Promise.resolve({
          data: {
            attestations: [{ id: '2', refUID: '0x1', content: { value: 100 }, revoked: true, timeCreated: 2 }]
          }
        });
      }
      return Promise.resolve({ data: { attestations: [] } });
    });

    const result = await getBuildersLeaderboardFromEAS({ week: '2025-W01' });
    expect(result).toEqual([]);
  });

  it('should handle contributions before/after ban/unban', async () => {
    mockGraphQlClient.query.mockImplementation(({ query }) => {
      const queryString = query.loc.source.body;
      if (queryString.includes('builderStatusEvent')) {
        return Promise.resolve({
          data: {
            attestations: [
              { id: '1', refUID: '0x1', content: { type: 'registered' }, timeCreated: 1 },
              { id: '2', refUID: '0x1', content: { type: 'banned' }, timeCreated: 3 },
              { id: '3', refUID: '0x1', content: { type: 'unbanned' }, timeCreated: 5 }
            ]
          }
        });
      }
      if (queryString.includes('contributionReceipt')) {
        return Promise.resolve({
          data: {
            attestations: [
              { id: '4', refUID: '0x1', content: { value: 100 }, revoked: false, timeCreated: 2 },
              { id: '5', refUID: '0x1', content: { value: 200 }, revoked: false, timeCreated: 4 },
              { id: '6', refUID: '0x1', content: { value: 300 }, revoked: false, timeCreated: 6 }
            ]
          }
        });
      }
      return Promise.resolve({ data: { attestations: [] } });
    });

    const result = await getBuildersLeaderboardFromEAS({ week: '2025-W01' });
    expect(result).toEqual([{ builder: expect.any(Object), gemsCollected: 400, rank: 1 }]);
  });
});
