'use client';

import InfoIcon from '@mui/icons-material/Info';
import type { SxProps } from '@mui/material';
import { IconButton, Stack, Typography } from '@mui/material';
import { BuilderCardActivityTooltip } from '@packages/scoutgame-ui/components/common/Card/BuilderCard/BuilderCardActivity/BuilderCardActivityTooltip';
import { Dialog } from '@packages/scoutgame-ui/components/common/Dialog';
import { useState } from 'react';

function ScoutInfoContent() {
  return (
    <Stack>
      <Typography variant='body2' fontWeight='bold'>
        RANK
      </Typography>
      <Typography mb={2}>
        Scout's current rank in the season based on Scout Points earned to date. Scouts earn Scout Points by holding the
        Cards of Developers participating in the weekly Gem competition by contributing to qualified open source
        repositories.
      </Typography>

      <Typography variant='body2' fontWeight='bold'>
        POINTS
      </Typography>
      <Typography mb={2}>Scout Points earned by the Scout this season to date.</Typography>

      <Typography variant='body2' fontWeight='bold'>
        DEVELOPERS
      </Typography>
      <Typography mb={2}>Number of unique Developers scouted.</Typography>

      <Typography variant='body2' fontWeight='bold'>
        CARDS
      </Typography>
      <Typography mb={2}>Total number of Developer Cards held by the Scout.</Typography>
    </Stack>
  );
}

export function InfoModal({ builder = false, sx }: { builder?: boolean; sx?: SxProps }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton color='secondary' onClick={() => setOpen(true)} sx={sx}>
        <InfoIcon />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Typography my={2} variant='h5' color='secondary'>
          {builder ? 'Developers' : 'Scouts'} Data Table
        </Typography>
        {builder ? <BuilderCardActivityTooltip /> : <ScoutInfoContent />}
      </Dialog>
    </>
  );
}
