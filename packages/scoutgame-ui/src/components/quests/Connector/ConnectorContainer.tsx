import { getTop5ConnectorsToday } from '@packages/scoutgame/topConnector/getTopConnectors';

import { Connector } from './Connector';

export async function ConectorContainer() {
  const data = await getTop5ConnectorsToday();

  if (data.length === 0) {
    return null;
  }

  return <Connector topUsers={data} />;
}
