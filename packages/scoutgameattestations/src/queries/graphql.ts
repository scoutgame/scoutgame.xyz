// Import direct from index.js necessary to avoid a bug with jest
// https://github.com/apollographql/apollo-feature-requests/issues/287#issuecomment-1192993207
import { ApolloClient, InMemoryCache } from '@apollo/client/core/index.js';
import { base, baseSepolia, optimism } from 'viem/chains';

import type { EASSchemaChain } from '../easSchemas/constants';

// For a specific profile, only refresh attestations every half hour

export const optimismEasGraphqlUri = 'https://optimism.easscan.org/graphql';
export const baseEasGraphqlUri = 'https://base.easscan.org/graphql';
export const baseSepoliaEasGraphqlUri = 'https://base-sepolia.easscan.org/graphql';

export function getEasGraphQlClient({ chainId }: { chainId: EASSchemaChain }): ApolloClient<any> {
  const uriMap: Record<EASSchemaChain, string> = {
    [optimism.id]: optimismEasGraphqlUri,
    [baseSepolia.id]: baseSepoliaEasGraphqlUri
  };

  return new ApolloClient({
    uri: uriMap[chainId],
    cache: new InMemoryCache({})
  });
}
