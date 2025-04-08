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
  selectedDevelopers,
  selectedNfts
}: {
  builder: BuilderInfo;
  matchupId: string;
  selectedDevelopers: string[];
  selectedNfts: string[];
}) {
  const isSelectedDev = selectedDevelopers.includes(builder.id);
  const isSelectedNft = selectedNfts.includes(builder.nftId!);
  // const isSelected = isSelectedDev || isSelectedNft;
  const isDisabled = isSelectedDev && !isSelectedNft; // if you selected a different NFT for the same dev, so users cant select the same dev twice
  const { execute: executeRemove, isExecuting: isExecutingRemove } = useAction(removeMatchupSelectionAction);
  const { execute: executeAdd, isExecuting: isExecutingAdd } = useAction(addMatchupSelectionAction);

  const loading = isExecutingRemove || isExecutingAdd;

  // keep an internal state to avoid flickering when the button is clicked
  const [isSelected, setIsSelected] = useState(isSelectedNft);

  async function handleAddMatchupSelection() {
    if (isDisabled) {
      return;
    }
    if (isSelected) {
      await executeRemove({
        matchupId,
        developerNftId: builder.nftId!
      });
    } else {
      await executeAdd({
        matchupId,
        developerNftId: builder.nftId!
      });
    }
    setIsSelected(!isSelected);
  }

  // sync the internal state with the external state
  useEffect(() => {
    setIsSelected(isSelectedNft);
  }, [isSelectedNft]);

  return (
    <Box
      sx={{
        background: isSelected
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
            <Checkbox checked={isSelected} disabled={loading || isDisabled} size='small' />
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
