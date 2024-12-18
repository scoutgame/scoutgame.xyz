import { Stack, Tooltip, Typography } from '@mui/material';
import Image from 'next/image';

import { PointsIcon } from '../../Icons';

import { BuilderCardActivity } from './BuilderCardActivity/BuilderCardActivity';
import { BuilderCardName } from './BuilderCardName';

export function BuilderCardStats({
  displayName,
  builderPoints,
  nftsSold,
  rank,
  last7DaysGems,
  size
}: {
  displayName: string;
  builderPoints?: number;
  nftsSold?: number;
  rank?: number;
  last7DaysGems?: number[];
  size: 'x-small' | 'small' | 'medium' | 'large';
}) {
  const mdFontSize = size === 'medium' || size === 'large' ? '14px' : '12px';
  const isValidRank = typeof rank === 'number' && rank !== -1;
  return (
    <Stack
      alignItems='center'
      pt={{
        xs: 0.15,
        md: 0.25
      }}
      gap={{
        xs: 0,
        md: size === 'medium' || size === 'large' ? 0.1 : 0
      }}
      width='100%'
      height='100%'
    >
      <BuilderCardName name={displayName} size={size} />
      <Stack flexDirection='row' width='100%' px={1} alignItems='center' justifyContent='space-between'>
        {typeof builderPoints === 'number' && (
          <Tooltip title='Total # of Scout Points earned this season to date'>
            <Stack flexDirection='row' gap={0.25} alignItems='center' width='33%'>
              <Typography
                sx={{
                  fontSize: {
                    xs: '11px',
                    md: mdFontSize
                  }
                }}
                component='span'
                color='green.main'
              >
                {builderPoints}
              </Typography>
              <PointsIcon size={14} color='green' />
            </Stack>
          </Tooltip>
        )}
        <Tooltip title='Current week’s rank'>
          <Stack flexDirection='row' gap={0.2} alignItems='center' justifyContent='center' width='33%'>
            <Typography
              sx={{
                fontSize: {
                  xs: '12px',
                  md: mdFontSize
                }
              }}
              component='span'
              color='text.secondary'
            >
              {isValidRank ? `#${rank}` : <>&ndash;</>}
            </Typography>
          </Stack>
        </Tooltip>
        {typeof nftsSold === 'number' && (
          <Tooltip title='Total # of cards sold this season to date'>
            <Stack flexDirection='row' gap={0.25} alignItems='center' justifyContent='flex-end' width='33%'>
              <Typography
                sx={{
                  fontSize: {
                    xs: '12px',
                    md: mdFontSize
                  }
                }}
                component='span'
                color='orange.main'
              >
                {nftsSold}
              </Typography>
              <Image width={12} height={12} src='/images/profile/icons/cards-orange.svg' alt='Cards' />
            </Stack>
          </Tooltip>
        )}
      </Stack>
      <Stack flexDirection='row' gap={1} width='100%' px={1} alignItems='center'>
        <Stack sx={{ backgroundColor: 'text.secondary', height: '1px', flex: 1 }} />
        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: {
              xs: '7.5px',
              md: size === 'medium' || size === 'large' ? '10px' : '8px'
            }
          }}
        >
          7 DAY ACTIVITY
        </Typography>
        <Stack sx={{ backgroundColor: 'text.secondary', height: '1px', flex: 1 }} />
      </Stack>
      <BuilderCardActivity size={size} last7DaysGems={last7DaysGems ?? []} />
    </Stack>
  );
}
