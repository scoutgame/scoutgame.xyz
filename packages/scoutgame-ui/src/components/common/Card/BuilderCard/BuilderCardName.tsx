'use client';

import { Stack, Typography } from '@mui/material';

import { useDynamicFontSize } from '../../../../hooks/useDynamicFontSize';

export function BuilderCardName({ name, size }: { name: string; size: 'x-small' | 'small' | 'medium' | 'large' }) {
  const maxFontSize = size === 'medium' || size === 'large' ? 14 : size === 'small' ? 12 : 11.5;
  const minFontSize = size === 'medium' || size === 'large' ? 11.5 : size === 'small' ? 9.5 : 8.5;
  const { fontSize, spanRef } = useDynamicFontSize(name, minFontSize, maxFontSize);

  return (
    <Stack
      sx={{
        width: 'calc(100% + 2.5px)',
        position: 'relative',
        background: 'linear-gradient(90deg, #A06CD5 0%, #FFAC81 50%, #A06CD5 100%)'
      }}
    >
      <Typography
        ref={spanRef}
        component='span'
        sx={{
          fontFamily: 'K2D',
          textAlign: 'center',
          fontSize,
          color: 'black !important'
        }}
      >
        {name}
      </Typography>
    </Stack>
  );
}
