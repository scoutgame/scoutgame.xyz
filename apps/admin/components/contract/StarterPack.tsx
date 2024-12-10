import 'server-only';

import { getStarterPackContractData } from 'lib/contract/getStarterPackContractData';

import { StarterPackView } from './StarterPackView';

export async function StarterPack() {
  const data = await getStarterPackContractData();
  return <StarterPackView {...data} />;
}
