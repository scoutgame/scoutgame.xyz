import { Stack, Typography } from '@mui/material';
import type { TopConnector } from '@packages/scoutgame/topConnector/getTopConnectors';

import { ConnectorTable } from './ConnectorTable';
import { Info } from './Info';

export function Connector({ topConnectors }: { topConnectors: TopConnector[] }) {
  return (
    <Stack justifyContent='center' alignItems='center' gap={2} my={2}>
      <Typography variant='h4' color='secondary' fontWeight={600} zIndex={1}>
        Top Connector Today
      </Typography>
      <Info />
      <Typography variant='subtitle1' fontWeight={600} zIndex={1}>
        Today's Top 5
      </Typography>
      <ConnectorTable topConnectors={topConnectors} />
    </Stack>
  );
}
