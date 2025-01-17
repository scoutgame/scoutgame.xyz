import 'server-only';

import type { ISOWeek } from '@packages/dates/config';

import { getStarterPackContractData } from 'lib/contract/getStarterPackContractData';

import { StarterPackView } from './StarterPackView';

export async function StarterPack({ season }: { season: ISOWeek }) {
  const data = await getStarterPackContractData({ season });
  return <StarterPackView {...data} />;
}
