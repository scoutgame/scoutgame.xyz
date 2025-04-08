'use client';

import { CardActionArea, CardMedia, Typography, Box, Stack } from '@mui/material';
import Link from 'next/link';

import { useDeveloperInfoModal } from 'components/common/DeveloperInfoModal/DeveloperInfoModalProvider';

import { BuilderCardLevel } from './BuilderCardLevel';

// Maintain a 3:4 aspect ratio for the NFT display
export const nftDisplaySize = {
  'x-small': {
    width: 140,
    height: 186
  },
  small: {
    width: 150,
    height: 200
  },
  medium: {
    width: 187.5,
    height: 250
  },
  large: {
    width: 200,
    height: 266.67
  }
};

export function BuilderCardNftDisplay({
  nftImageUrl,
  children,
  path,
  level,
  size = 'medium',
  hideDetails = false,
  disableProfileUrl = false,
  isStarterCard,
  variant
}: {
  variant?: 'matchup_selection';
  isStarterCard?: boolean;
  path: string;
  nftImageUrl?: string | null;
  level?: number | null;
  children?: React.ReactNode;
  size?: 'x-small' | 'small' | 'medium' | 'large';
  hideDetails?: boolean;
  disableProfileUrl?: boolean;
}) {
  const width = nftDisplaySize[size].width;
  const height = nftDisplaySize[size].height;
  const { openModal } = useDeveloperInfoModal();
  return (
    <Box
      overflow='hidden'
      width={width}
      height={height}
      sx={{
        backgroundColor: 'black.dark',
        borderRadius: '4px',
        borderBottomLeftRadius: variant === 'matchup_selection' ? 0 : '4px',
        borderBottomRightRadius: variant === 'matchup_selection' ? 0 : '4px'
      }}
    >
      <CardActionArea
        disabled={disableProfileUrl}
        onClick={(e) => {
          e.preventDefault();
          openModal(path);
        }}
        component={Link}
        href={`/u/${path}`}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%'
        }}
      >
        <Box position='absolute'>
          {nftImageUrl ? (
            <CardMedia component='img' image={nftImageUrl} />
          ) : (
            <CardMedia component='img' image='/images/no_nft_person.png' />
          )}
          <BuilderCardLevel level={level} size={size} isStarterCard={isStarterCard} />
        </Box>
        <Box
          sx={{
            height: hideDetails ? 'fit-content' : '33.33%',
            position: 'absolute',
            width: {
              xs: 'calc(100% - 6.5px)',
              md: 'calc(100% - 8px)'
            },
            left: '50%',
            backgroundColor: hideDetails ? 'transparent' : '#000',
            transform: 'translateX(-50%)',
            bottom:
              variant === 'matchup_selection'
                ? 0
                : {
                    xs: size === 'x-small' ? 13.5 : 12.5,
                    md: size === 'small' ? 17.5 : 12.5
                  }
          }}
        >
          {nftImageUrl ? null : (
            <Typography gutterBottom variant='body1' textAlign='center' noWrap>
              Unavailable
            </Typography>
          )}
          {children}
        </Box>
      </CardActionArea>
    </Box>
  );
}
