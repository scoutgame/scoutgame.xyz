import { Stack, Typography } from '@mui/material';
import type { TopConnector } from '@packages/scoutgame/topConnector/getTopConnectors';
import Image from 'next/image';

import { ConnectorTable } from './ConnectorTable';
import { Info } from './Info';

export function Connector({ topConnectors }: { topConnectors: TopConnector[] }) {
  return (
    <Stack justifyContent='center' alignItems='center' gap={2} my={2}>
      <Typography variant='h4' color='secondary' fontWeight={600} zIndex={1}>
        Today's Referral Champion
      </Typography>
      <Info />
      {topConnectors.length > 0 ? (
        <>
          <Typography variant='subtitle1' fontWeight={600} zIndex={1}>
            Today's Top 5
          </Typography>
          <ConnectorTable topConnectors={topConnectors} />
        </>
      ) : (
        <>
          <Typography variant='body2'>
            Easy 25 OP up for grabs! All you have to do is invite a friend... and nag them until they actually sign up
            with your link and scout their first full season card. They will get rewarded too! It's a win-win!
          </Typography>
          <Image src='/images/quests/ice-cream-cone.png' alt='Connector' width={200} height={200} />
        </>
      )}
    </Stack>
  );
}
