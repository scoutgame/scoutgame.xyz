'use client';

import { LoadingButton } from '@mui/lab';
import { Box, Checkbox, CircularProgress, Typography } from '@mui/material';
import { getCurrentWeek } from '@packages/dates/utils';
import { addMatchupSelectionAction } from '@packages/matchup/addMatchupSelectionAction';
import { removeMatchupSelectionAction } from '@packages/matchup/removeMatchupSelectionAction';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';

import { builderCardBackground } from 'components/common/Card/BuilderCard/BuilderCardName';

export function DevCardActionArea({
  builder,
  matchupId,
  selectedDevelopers
}: {
  builder: BuilderInfo;
  matchupId: string;
  selectedDevelopers: string[];
}) {
  const isSelected = selectedDevelopers.includes(builder.id);
  const { execute: executeRemove, isExecuting: isExecutingRemove } = useAction(removeMatchupSelectionAction);
  const { execute: executeAdd, isExecuting: isExecutingAdd } = useAction(addMatchupSelectionAction);

  const loading = isExecutingRemove || isExecutingAdd;

  // keep an internal state to avoid flickering when the button is clicked
  const [_isSelected, setIsSelected] = useState(isSelected);

  async function handleAddMatchupSelection() {
    if (_isSelected) {
      await executeRemove({
        matchupId,
        developerId: builder.id
      });
    } else {
      await executeAdd({
        matchupId,
        developerId: builder.id
      });
    }
    setIsSelected(!_isSelected);
  }

  useEffect(() => {
    setIsSelected(isSelected);
  }, [isSelected]);

  return (
    <Box
      sx={{
        background: _isSelected
          ? 'var(--mui-palette-secondary-main)'
          : builderCardBackground(builder.nftType === 'starter_pack'),
        borderBottomLeftRadius: '4px',
        borderBottomRightRadius: '4px',
        cursor: 'pointer'
      }}
      onClick={handleAddMatchupSelection}
    >
      <Box position='relative'>
        <Box position='absolute' top={0} right={0} bottom={0} left={0} display='flex' alignItems='center'>
          {loading ? (
            <Box display='flex' justifyContent='center' alignItems='center' p={1}>
              <CircularProgress size={18} />
            </Box>
          ) : (
            <Checkbox checked={_isSelected} disabled={loading} size='small' />
          )}
        </Box>
        <Box textAlign='center'>
          <Typography
            color='black'
            variant='caption'
            noWrap
            textOverflow='ellipsis'
            maxWidth='90px'
            margin='0 auto'
            component='p'
          >
            {builder.displayName}
          </Typography>
          <Typography color='black' component='span'>
            {builder.level}{' '}
          </Typography>
          <Typography color='black' variant='caption' component='span'>
            credits
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
