import type { Repo } from '@packages/scoutgame/repos/getRepos';
import { useGET } from '@packages/scoutgame-ui/hooks/helpers';
import type { NftCountResponse } from 'app/api/session/nft-count/route';

export function useGetNftCount() {
  return useGET<{ nftCount: number }>('/api/session/nft-count');
}
