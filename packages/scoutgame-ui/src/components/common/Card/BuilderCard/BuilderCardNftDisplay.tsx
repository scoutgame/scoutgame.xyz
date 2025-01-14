import { CardActionArea, CardMedia, Typography, Box, Stack } from '@mui/material';
import Link from 'next/link';

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
  starterPack
}: {
  starterPack?: boolean;
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

  return (
    <Box overflow='hidden' width={width} height={height} sx={{ backgroundColor: 'black.dark', borderRadius: '4px' }}>
      <CardActionArea
        disabled={disableProfileUrl}
        LinkComponent={Link}
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
                backgroundColor: starterPack ? 'yellow.main' : 'orange.main',
                borderRadius: '50%',
                border: '3.5px solid #000'
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
            bottom: {
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
