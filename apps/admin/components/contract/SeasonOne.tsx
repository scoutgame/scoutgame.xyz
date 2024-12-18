import 'server-only';

import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';

import { getContractData } from 'lib/contract/getContractData';
import { getStarterPackContractData } from 'lib/contract/getStarterPackContractData';

import { SeasonOneView } from './SeasonOneView';

export async function SeasonOne() {
  const data = await getContractData();
  return <SeasonOneView {...data} />;
}
