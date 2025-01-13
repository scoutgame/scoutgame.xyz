import 'server-only';

import { getContractData } from 'lib/contract/getContractData';

import { SeasonOneView } from './SeasonOneView';

export async function SeasonOne() {
  const data = await getContractData();
  return <SeasonOneView {...data} />;
}
