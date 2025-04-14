import { Stack, Typography } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Image from 'next/image';

const dialogPaperBgColor = 'background.dark';

export function DeveloperInfoSeasonStats({
  seasonPoints,
  scoutedBy,
  cardsSold,
  isLastSeason
}: {
  seasonPoints: number;
  scoutedBy: number;
  cardsSold: number;
  isLastSeason?: boolean;
}) {
  const isDesktop = useMdScreen();

  return (
    <Stack
      bgcolor={dialogPaperBgColor}
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
      <Typography color='secondary.main' component='span'>
        <Typography
          component='span'
          display={{
            xs: 'none',
            md: 'inline'
          }}
          color='secondary.main'
        >
          {isLastSeason ? 'This' : 'Last'}
        </Typography>{' '}
        Season
      </Typography>
      <Stack>
        <Stack direction='row' gap={0.5} alignItems='center'>
          <Typography variant={isDesktop ? 'h6' : 'body1'}>{seasonPoints}</Typography>
          <Image
            src='/images/icons/binoculars.svg'
            width={isDesktop ? '24' : '18'}
            height={isDesktop ? '24' : '18'}
            alt='gem icon'
          />
        </Stack>
        <Typography variant={isDesktop ? 'h6' : 'body1'}>{scoutedBy} Scouts</Typography>
        <Stack direction='row' gap={0.5} alignItems='center'>
          <Typography variant={isDesktop ? 'h6' : 'body1'}>{cardsSold}</Typography>
          <Image
            src='/images/profile/icons/cards-white.svg'
            width={isDesktop ? 22 : 18}
            height={isDesktop ? 22 : 18}
            alt='cards sold icon'
          />
          <Typography variant={isDesktop ? 'h6' : 'body1'}>Sold</Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}
