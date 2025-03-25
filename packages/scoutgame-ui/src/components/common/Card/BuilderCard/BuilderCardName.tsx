'use client';

import { Stack, Tooltip, Typography } from '@mui/material';
import Image from 'next/image';

import { useDynamicFontSize } from '../../../../hooks/useDynamicFontSize';
import { useIsMounted } from '../../../../hooks/useIsMounted';
import { useMdScreen } from '../../../../hooks/useMediaScreens';

export function BuilderCardName({
  name,
  size,
  isStarterCard,
  nftsSoldToLoggedInScout
}: {
  nftsSoldToLoggedInScout?: number | null;
  name: string;
  size: 'x-small' | 'small' | 'medium' | 'large';
  isStarterCard?: boolean;
}) {
  const maxFontSize = size === 'medium' || size === 'large' ? 16 : size === 'small' ? 12 : 11.5;
  const minFontSize = size === 'medium' || size === 'large' ? 12 : size === 'small' ? 9.5 : 8.5;
  const { fontSize, spanRef } = useDynamicFontSize(name, minFontSize, maxFontSize);
  const isMdScreen = useMdScreen();
  const isMounted = useIsMounted();
  const showScoutCount = !!nftsSoldToLoggedInScout;

  if (!isMounted) {
    return null;
  }

  return (
    <Stack
      sx={{
        width: 'calc(100% + 2.5px)',
        left: '-1.25px',
        position: 'relative',
        paddingLeft: '1.25px',
        paddingRight: '1.25px',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isStarterCard
          ? 'linear-gradient(90deg, #86ff9e 0%, #fcff6c 50%, #86ff9e 100%)'
          : 'linear-gradient(90deg, #A06CD5 0%, #FFAC81 50%, #A06CD5 100%)'
      }}
    >
      <Stack
        flexDirection='row'
        alignItems='center'
        justifyContent='center'
        width={showScoutCount ? 'calc(100% - 20px)' : '100%'}
      >
        <Typography
          ref={spanRef}
          component='span'
          sx={{
            width: '100%',
            fontFamily: 'K2D',
            textAlign: 'center',
            fontSize,
            color: 'black !important',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'clip'
          }}
        >
          {name}
        </Typography>
      </Stack>
      {showScoutCount ? (
        <Tooltip title='# of cards you hold'>
          <Stack flexDirection='row' alignItems='center' height='100%' gap={0.35}>
            <Typography
              sx={{
                fontFamily: 'K2D',
                color: 'black !important',
                fontSize
              }}
            >
              {nftsSoldToLoggedInScout}
            </Typography>
            <Image
              width={isMdScreen ? 12.5 : 10}
              height={isMdScreen ? 12.5 : 10}
              src='/images/profile/icons/cards-black.svg'
              alt='green-icon'
            />
          </Stack>
        </Tooltip>
      ) : null}
    </Stack>
  );
}
