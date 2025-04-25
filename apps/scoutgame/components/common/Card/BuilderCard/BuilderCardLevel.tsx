'use client';

import { Info } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import { Dialog } from '@packages/scoutgame-ui/components/common/Dialog';
import { useState } from 'react';

import { BuilderCardActivityTooltip } from './BuilderCardActivity/BuilderCardActivityTooltip';

export function BuilderCardLevel({
  level,
  size,
  isStarterCard
}: {
  level?: number | null;
  size: string;
  isStarterCard?: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      {Number.isInteger(level) ? (
        <Stack
          sx={{
            position: 'absolute',
            width: {
              xs: 40,
              md: size === 'small' ? 45 : 50
            },
            height: {
              xs: 40,
              md: size === 'small' ? 45 : 50
            },
            top: {
              xs: 7.5,
              md: 10
            },
            right: {
              xs: 7.5,
              md: 10
            },
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isStarterCard ? 'pink.main' : 'secondary.main',
            borderRadius: '50%',
            border: '3.5px solid #000'
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsDialogOpen(true);
          }}
        >
          <Typography
            fontFamily='Jura'
            fontSize={{
              xs: 7.5,
              md: size === 'small' ? 7.5 : 10
            }}
            pt={{
              xs: 0.5,
              md: 0
            }}
            color='black.main'
            lineHeight={1}
            mb={0.25}
          >
            LEVEL
          </Typography>
          <Typography
            fontFamily='Jura'
            fontSize={{
              xs: 15,
              md: size === 'small' ? 17.5 : 20
            }}
            color='black.main'
            lineHeight={1}
          >
            {level}
          </Typography>
        </Stack>
      ) : null}
      <Dialog
        onClick={(e) => {
          e.stopPropagation();
        }}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={
          <Stack flexDirection='row' alignItems='center' gap={1}>
            <Info color='secondary' />
            <Typography color='secondary' variant='h5'>
              Developer Data
            </Typography>
          </Stack>
        }
      >
        <BuilderCardActivityTooltip />
      </Dialog>
    </>
  );
}
