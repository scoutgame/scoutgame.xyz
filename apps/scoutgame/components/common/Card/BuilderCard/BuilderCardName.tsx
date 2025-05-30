'use client';

import { lighten, Stack, Tooltip, Typography } from '@mui/material';
import { useDynamicFontSize } from '@packages/scoutgame-ui/hooks/useDynamicFontSize';
import { useIsMounted } from '@packages/scoutgame-ui/hooks/useIsMounted';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { brandColor, secondaryText } from '@packages/scoutgame-ui/theme/colors.ts';
import Image from 'next/image';

export const builderCardBackground = (isStarterCard: boolean | undefined) => {
  return isStarterCard
    ? 'linear-gradient(90deg, #86ff9e 0%, #ec7cbf 50%, #86ff9e 100%)'
    : `linear-gradient(90deg, ${lighten(brandColor, 0.25)} 0%, ${secondaryText} 60%)`;
};

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
        background: builderCardBackground(isStarterCard)
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
