import 'server-only';

import type { ISOWeek } from '@packages/dates/config';

import { getPreSeasonContractData } from 'lib/contract/getPreSeasonContractData';

import { PreSeasonNFTView } from './PreSeasonNFTView';

export async function PreSeasonNFT({ season }: { season: ISOWeek }) {
  const data = await getPreSeasonContractData({ season });
  return <PreSeasonNFTView {...data} />;
}
