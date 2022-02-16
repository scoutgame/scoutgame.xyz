import { Bounty as IBounty, BountyStatus, BOUNTY_LABELS as BountyLabels } from 'models/Bounty';
import { Card, CardHeader, CardContent, Chip, Typography, Grid } from '@mui/material';
import { useState } from 'react';
import { BrandColors } from 'theme/colors';

export interface IBountyInput {
  bounty: IBounty
}

const BountyStatusColours: Record<BountyStatus, BrandColors> = {
  open: 'gray',
  assigned: 'blue',
  review: 'red',
  complete: 'purple',
  paid: 'green'
};

export function Bounty ({ bounty }: IBountyInput) {

  const [editBounty, toggleBountyDialog] = useState(false);

  const bountyColor = BountyStatusColours[bounty.status];
  const bountyLabel = BountyLabels[bounty.status];

  return (
    <Card
      sx={{
        display: 'inline-block',
        flexDirection: 'column',
        width: 290,
        m: '5px',
        minHeight: 200,
        cursor: 'pointer'
      }}
      onClick={() => {
        toggleBountyDialog(true);
      }}
      variant='outlined'
    >
      <CardHeader subheader={bounty.title} />
      <CardContent sx={{ flexGrow: 1, display: 'flex', height: '80%' }}>
        <Grid container direction='row' justifyContent='space-between'>
          <Grid item xs={12} sx={{ height: '73%' }}>

            <Typography paragraph={true}>
              {bounty.description.trim().substring(0, 120)}
              ..
            </Typography>

          </Grid>
          <Grid item xs={12}>
            <Chip variant='filled' label={bountyLabel} color={bountyColor as any} />
          </Grid>

        </Grid>
      </CardContent>

    </Card>
  );
}
