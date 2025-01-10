import { getTop5ConnectorsToday } from '@packages/scoutgame/topConnector/getTopConnectors';

import { Connector } from './Connector';

export async function ConectorContainer() {
  const data = await getTop5ConnectorsToday();

  return <Connector topUsers={data} />;
}
