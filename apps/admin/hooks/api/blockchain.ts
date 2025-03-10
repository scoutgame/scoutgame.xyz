import { useGET } from '@packages/scoutgame-ui/hooks/helpers';

import type { RepoSearchResult } from '../../app/api/github/search-repos/route';

export function useGetScoutEvents(scoutId: string) {
  return useGET<RepoSearchResult[]>(scoutId ? '/api/blockchain/scout-events' : null, { scoutId });
}

export function useGetTransactionStatus({ chainId, txHash }: { chainId: string; txHash: string }) {
  return useGET<RepoSearchResult[]>(chainId && txHash ? '/api/blockchain/transaction-status' : null, {
    chainId,
    txHash
  });
}
