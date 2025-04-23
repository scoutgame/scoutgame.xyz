'use client';

import { Button, Grid, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import Link from 'next/link';
import React from 'react';

import { DevelopersGallery } from 'components/common/Gallery/DevelopersGallery';

export function BuildersYouKnowContent({
  onClickContinue,
  builders
}: {
  onClickContinue?: React.MouseEventHandler;
  builders: BuilderInfo[];
}) {
  return (
    <Grid gap={2}>
      <Grid size={{ xs: 12 }}>
        <Typography color='secondary' textAlign='center' width='100%' fontWeight={700} variant='h5'>
          Developers You Know
        </Typography>
      </Grid>

      <DevelopersGallery size='small' builders={builders} />

      <Grid size={{ xs: 12 }}>
        <Button
          LinkComponent={Link}
          variant='contained'
          onClick={onClickContinue}
          href='/'
          data-test='continue-button'
          sx={{ margin: '0 auto', px: 1, display: 'flex', width: 'fit-content' }}
        >
          Go to Scout Game
        </Button>
      </Grid>
    </Grid>
  );
}
