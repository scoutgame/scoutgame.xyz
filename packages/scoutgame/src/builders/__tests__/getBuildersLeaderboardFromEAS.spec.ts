import { jest } from '@jest/globals';
import { encodeContributionReceiptAttestation } from '@packages/scoutgameattestations/easSchemas/contributionReceiptSchema';
import { encodeDeveloperStatusEventAttestation } from '@packages/scoutgameattestations/easSchemas/developerStatusEventSchema';
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

const season = '2025-W01';

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

      if (schemaId === builderEventSchema) {
        return Promise.resolve({
          data: {
            attestations: [
              {
                id: '0x1',
                refUID: builder01OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  description: 'Registered',
                  type: 'registered',
                  season
                }),
                timeCreated: 1,
                revoked: false
              },
              {
                id: '0x2',
                refUID: builder02OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  description: 'Registered',
                  type: 'registered',
                  season
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

    const result = await getBuildersLeaderboardFromEAS({ week: season });
    expect(result).toEqual([]);
  });

  it('should handle banned and registered builders', async () => {
    mockGraphQlClient.query.mockImplementation(({ variables }) => {
      const schemaId = variables.where.schemaId.equals;
      const userRefUID = variables.where.refUID?.equals;

      if (schemaId === builderEventSchema) {
        return Promise.resolve({
          data: {
            attestations: [
              {
                id: '0x1',
                refUID: builder01OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  type: 'registered',
                  description: 'Registered',
                  season
                }),
                timeCreated: 1,
                revoked: false
              },
              {
                id: '0x2',
                refUID: builder01OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  type: 'banned',
                  description: 'Banned',
                  season
                }),
                timeCreated: 2,
                revoked: false
              },
              {
                id: '0x3',
                refUID: builder02OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  type: 'registered',
                  description: 'Registered',
                  season
                }),
                timeCreated: 1,
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
                  id: '0x4',
                  refUID: builder01OnchainProfileAttestationUid,
                  data: encodeContributionReceiptAttestation({
                    value: 50,
                    description: 'Contribution',
                    type: 'contribution',
                    url: 'https://example.com',
                    metadataUrl: 'https://example.com/metadata'
                  }),
                  timeCreated: 3,
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
                    value: 20,
                    description: 'Contribution',
                    type: 'contribution',
                    url: 'https://example.com',
                    metadataUrl: 'https://example.com/metadata'
                  }),
                  timeCreated: 3,
                  revoked: false
                }
              ]
            }
          }) as Promise<{ data: QueryResult }>;
        }
      }

      return Promise.resolve({ data: { attestations: [] } });
    });

    const result = await getBuildersLeaderboardFromEAS({ week: season });
    expect(result).toMatchObject<LeaderboardBuilder[]>([
      {
        builder: {
          displayName: builder02.displayName,
          id: builder02.id,
          path: builder02.path
        },
        gemsCollected: 20,
        rank: 1
      }
    ]);
  });

  it('should ignore contribution receipts during the banned period for a builder', async () => {
    mockGraphQlClient.query.mockImplementation(({ variables }) => {
      const schemaId = variables.where.schemaId.equals;
      const userRefUID = variables.where.refUID?.equals;

      if (schemaId === builderEventSchema) {
        return Promise.resolve({
          data: {
            attestations: [
              // Registered builder
              {
                id: '0x1',
                refUID: builder01OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  type: 'registered',
                  description: 'Registered',
                  season
                }),
                timeCreated: 1,
                revoked: false
              },
              // Banned builder
              {
                id: '0x2',
                refUID: builder02OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  type: 'banned',
                  description: 'Banned',
                  season
                }),
                timeCreated: 2,
                revoked: false
              },
              // Banned then unbanned builder
              {
                id: '0x3',
                refUID: builder03OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  type: 'registered',
                  description: 'Registered',
                  season
                }),
                timeCreated: 1,
                revoked: false
              },
              {
                id: '0x4',
                refUID: builder03OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  type: 'banned',
                  description: 'Banned',
                  season
                }),
                timeCreated: 3,
                revoked: false
              },
              {
                id: '0x5',
                refUID: builder03OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  type: 'unbanned',
                  description: 'Unbanned',
                  season
                }),
                timeCreated: 5,
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
                  id: '0x6',
                  refUID: builder01OnchainProfileAttestationUid,
                  data: encodeContributionReceiptAttestation({
                    value: 50,
                    description: 'Contribution',
                    type: 'contribution',
                    url: 'https://example.com',
                    metadataUrl: 'https://example.com/metadata'
                  }),
                  timeCreated: 2,
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
                  id: '0x7',
                  refUID: builder02OnchainProfileAttestationUid,
                  data: encodeContributionReceiptAttestation({
                    value: 75,
                    description: 'Contribution',
                    type: 'contribution',
                    url: 'https://example.com',
                    metadataUrl: 'https://example.com/metadata'
                  }),
                  timeCreated: 3,
                  revoked: false
                }
              ]
            }
          }) as Promise<{ data: QueryResult }>;
        }

        if (userRefUID === builder03OnchainProfileAttestationUid) {
          return Promise.resolve({
            data: {
              attestations: [
                // Before ban
                {
                  id: '0x8',
                  refUID: builder03OnchainProfileAttestationUid,
                  data: encodeContributionReceiptAttestation({
                    value: 100,
                    description: 'Contribution',
                    type: 'contribution',
                    url: 'https://example.com',
                    metadataUrl: 'https://example.com/metadata'
                  }),
                  timeCreated: 2,
                  revoked: false
                },
                // During ban (between timeCreated 3 and 5)
                {
                  id: '0x9',
                  refUID: builder03OnchainProfileAttestationUid,
                  data: encodeContributionReceiptAttestation({
                    value: 50,
                    description: 'Contribution',
                    type: 'contribution',
                    url: 'https://example.com',
                    metadataUrl: 'https://example.com/metadata'
                  }),
                  timeCreated: 4,
                  revoked: false
                },
                // After unban
                {
                  id: '0x10',
                  refUID: builder03OnchainProfileAttestationUid,
                  data: encodeContributionReceiptAttestation({
                    value: 300,
                    description: 'Contribution',
                    type: 'contribution',
                    url: 'https://example.com',
                    metadataUrl: 'https://example.com/metadata'
                  }),
                  timeCreated: 6,
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
        builder: { displayName: builder03.displayName, id: builder03.id, path: builder03.path },
        // 100 from timeCreated 2 + 300 from timeCreated 6 (skipping 200 during ban)
        gemsCollected: 400,
        rank: 1
      },
      {
        builder: { displayName: builder01.displayName, id: builder01.id, path: builder01.path },
        gemsCollected: 50,
        rank: 2
      }
    ]);
  });

  it('should skip revoked contributions', async () => {
    mockGraphQlClient.query.mockImplementation(({ variables }) => {
      const schemaId = variables.where.schemaId.equals;
      const userRefUID = variables.where.refUID?.equals;

      if (schemaId === builderEventSchema) {
        return Promise.resolve({
          data: {
            attestations: [
              {
                id: '0x1',
                refUID: builder01OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  type: 'registered',
                  description: 'Registered',
                  season
                }),
                timeCreated: 1,
                revoked: false
              }
            ]
          }
        }) as Promise<{ data: QueryResult }>;
      }

      if (schemaId === contributionReceiptSchema && userRefUID === builder01OnchainProfileAttestationUid) {
        return Promise.resolve({
          data: {
            attestations: [
              {
                id: '0x2',
                refUID: builder01OnchainProfileAttestationUid,
                data: encodeContributionReceiptAttestation({
                  value: 100,
                  description: 'Contribution',
                  type: 'contribution',
                  url: 'https://example.com',
                  metadataUrl: 'https://example.com/metadata'
                }),
                timeCreated: 2,
                revoked: true
              },
              {
                id: '0x3',
                refUID: builder01OnchainProfileAttestationUid,
                data: encodeContributionReceiptAttestation({
                  value: 200,
                  description: 'Contribution',
                  type: 'contribution',
                  url: 'https://example.com',
                  metadataUrl: 'https://example.com/metadata'
                }),
                timeCreated: 3,
                revoked: false
              }
            ]
          }
        }) as Promise<{ data: QueryResult }>;
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
        gemsCollected: 200,
        rank: 1
      }
    ]);
  });

  it('should query attestations within the week and seasontimestamps', async () => {
    mockGraphQlClient.query.mockImplementation(({ variables }) => {
      const schemaId = variables.where.schemaId.equals;

      if (schemaId === builderEventSchema) {
        return Promise.resolve({
          data: {
            attestations: [
              {
                id: '0x1',
                refUID: builder01OnchainProfileAttestationUid,
                data: encodeDeveloperStatusEventAttestation({
                  type: 'registered',
                  description: 'Registered',
                  season
                }),
                timeCreated: 1,
                revoked: false
              }
            ]
          }
        }) as Promise<{ data: QueryResult }>;
      }

      return Promise.resolve({ data: { attestations: [] } });
    });

    await getBuildersLeaderboardFromEAS({ week: '2025-W02' });

    const seasonQueryCall = mockGraphQlClient.query.mock.calls[0][0];

    const weeksQueryCall = mockGraphQlClient.query.mock.calls[1][0];

    // Monday, 6 January 2025 00:00:00
    const expectedSeasonGte = 1_736_121_600;
    // Sunday, 20 April 2025 23:59:59
    const expectedSeasonLte = 1_745_193_599;

    // Monday, 13 January 2025 00:00:00
    const expectedWeekGte = 1_736_121_600;
    // Sunday, 19 January 2025 23:59:59
    const expectedWeekLte = 1_736_726_399;

    // Make sure we searched for builder status events within the season
    expect(seasonQueryCall.variables.where).toMatchObject({
      schemaId: {
        equals: builderEventSchema
      },
      timeCreated: {
        gte: expectedSeasonGte,
        lte: expectedSeasonLte
      }
    });
    // Make sure we searched for contribution receipts within the week
    expect(weeksQueryCall.variables.where).toMatchObject({
      schemaId: {
        equals: contributionReceiptSchema
      },
      refUID: {
        equals: builder01OnchainProfileAttestationUid
      },
      timeCreated: {
        gte: expectedWeekGte,
        lte: expectedWeekLte
      }
    });
  });
});
