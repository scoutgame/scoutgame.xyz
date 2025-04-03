import { Box, Card, Typography } from '@mui/material';
import type { MyMatchup } from '@packages/matchup/getMyMatchup';

import { BuilderCard } from 'components/common/Card/BuilderCard/BuilderCard';

export function MatchUpSubmittedView({ myMatchup }: { myMatchup: MyMatchup }) {
  return (
    <Box>
      <Typography color='secondary' variant='h5' sx={{ mb: 2 }} align='center'>
        {myMatchup.scout.displayName}'s team
      </Typography>
      <Box display='flex' flexDirection='row' flexWrap='wrap' gap={4} justifyContent='center'>
        {myMatchup.selections.map((selection) => (
          <BuilderCard
            key={selection.developer.id}
            builder={{
              ...selection.developer,
              builderStatus: 'approved',
              nftType: 'default',
              price: BigInt(0),
              listings: []
            }}
            type='default'
            sx={{ margin: 0 }}
          />
        ))}
      </Box>
    </Box>
  );
}
