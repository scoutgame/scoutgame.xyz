import 'server-only';

import type { ISOWeek } from '@packages/dates/config';

import { getStarterPackContractData } from 'lib/contract/getStarterPackContractData';

import { StarterNFTView } from './StarterNFTView';

export async function StarterNFT({ season }: { season: ISOWeek }) {
  const data = await getStarterPackContractData({ season });
  return <StarterNFTView {...data} />;
}
