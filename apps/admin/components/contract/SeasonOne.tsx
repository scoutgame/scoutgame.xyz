import 'server-only';

import { getContractData } from 'lib/contract/getContractData';
import { getStarterPackContractData } from 'lib/contract/getStarterPackContractData';
import { getUserFromSession } from 'lib/session/getUserFromSession';

import { SeasonOneView } from './SeasonOneView';

export async function SeasonOne() {
  const data = await getContractData();
  return <SeasonOneView {...data} />;
}
