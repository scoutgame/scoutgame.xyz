import { ApolloClient, InMemoryCache } from '@apollo/client';
import { base, baseSepolia } from 'viem/chains';

import type { EASSchemaChain } from '../easSchemas/constants';

// For a specific profile, only refresh attestations every half hour

export const baseEasGraphqlUri = 'https://base.easscan.org/graphql';
export const baseSepoliaEasGraphqlUri = 'https://base-sepolia.easscan.org/graphql';

export function getEasGraphQlClient({ chainId }: { chainId: EASSchemaChain }): ApolloClient<any> {
  const uriMap: Record<EASSchemaChain, string> = {
    [base.id]: baseEasGraphqlUri,
    [baseSepolia.id]: baseSepoliaEasGraphqlUri
  };

  return new ApolloClient({
    uri: uriMap[chainId],
    cache: new InMemoryCache({})
  });
}
