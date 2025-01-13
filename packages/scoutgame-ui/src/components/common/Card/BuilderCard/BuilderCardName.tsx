'use client';

import { Stack, Typography } from '@mui/material';

import { useDynamicFontSize } from '../../../../hooks/useDynamicFontSize';

export function BuilderCardName({
  name,
  size,
  starterPack
}: {
  name: string;
  size: 'x-small' | 'small' | 'medium' | 'large';
  starterPack?: boolean;
}) {
  const maxFontSize = size === 'medium' || size === 'large' ? 16 : size === 'small' ? 12 : 11.5;
  const minFontSize = size === 'medium' || size === 'large' ? 12 : size === 'small' ? 9.5 : 8.5;
  const { fontSize, spanRef } = useDynamicFontSize(name, minFontSize, maxFontSize);

  return (
    <Stack
      sx={{
        width: 'calc(100% + 2.5px)',
        left: '-1.25px',
        position: 'relative',
        background: starterPack
          ? 'linear-gradient(90deg, #86ff9e 0%, #fcff6c 50%, #86ff9e 100%)'
          : 'linear-gradient(90deg, #A06CD5 0%, #FFAC81 50%, #A06CD5 100%)'
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
