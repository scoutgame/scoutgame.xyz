import { Stack, Typography } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Image from 'next/image';

export function DeveloperInfoWeekStats({ rank, gemsCollected }: { rank: number; gemsCollected: number }) {
  const isDesktop = useMdScreen();

  return (
    <Stack
      bgcolor='background.dark'
      p={{
        xs: 0.5,
        md: 1
      }}
      borderRadius={1}
      gap={0.5}
      minWidth={{
        xs: 100,
        md: 125
      }}
      width='25%'
    >
      <Stack>
        <Typography color='secondary.main'>
          <Typography
            component='span'
            display={{
              xs: 'none',
              md: 'inline'
            }}
            color='secondary.main'
          >
            Current
          </Typography>{' '}
          Rank
        </Typography>
        <Typography variant={isDesktop ? 'h6' : 'body1'}>{rank}</Typography>
      </Stack>
      <Stack>
        <Typography color='secondary.main'>
          <Typography
            component='span'
            display={{
              xs: 'none',
              md: 'inline'
            }}
            color='secondary.main'
          >
            Week's
          </Typography>{' '}
          Gems
        </Typography>
        <Stack direction='row' gap={0.5} alignItems='center'>
          <Typography variant={isDesktop ? 'h6' : 'body1'}>{gemsCollected}</Typography>
          <Image
            src='/images/icons/gem.svg'
            width={isDesktop ? '24' : '18'}
            height={isDesktop ? '24' : '18'}
            alt='gem icon'
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
