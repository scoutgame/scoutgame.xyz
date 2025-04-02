import { Box, Card, Typography } from '@mui/material';
import type { MyMatchup } from '@packages/matchup/getMyMatchup';

import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';

export function MatchUpSubmittedView({ myMatchup }: { myMatchup: MyMatchup }) {
  return (
    <Box>
      <Typography color='secondary' variant='h5' gutterBottom align='center'>
        {myMatchup.scout.displayName}'s team
      </Typography>

      <BuildersGallery
        builders={myMatchup.selections.map((selection) => ({
          ...selection.developer,
          credits: selection.credits,
          price: BigInt(0),
          builderStatus: 'approved',
          nftType: 'default',
          congratsImageUrl: null,
          listings: []
        }))}
        columns={3}
        showPurchaseButton={false}
        scoutInView={myMatchup.scout.id}
      />
    </Box>
  );
}
