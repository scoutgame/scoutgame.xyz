import type { NftStats } from '@packages/scoutgame/builders/getBuilderNftStats';
import { useGETImmutable } from '@packages/scoutgame-ui/hooks/helpers';

export function useGetBuilderNftStats({ builderId }: { builderId: string }) {
  return useGETImmutable<NftStats>(`/api/builders/${builderId}/nft-stats`);
}
