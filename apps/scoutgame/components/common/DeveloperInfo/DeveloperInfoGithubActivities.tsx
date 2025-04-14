import { Stack, Typography } from '@mui/material';
import type { DeveloperGithubActivity } from '@packages/scoutgame/builders/getDeveloperInfo';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { getShortenedRelativeTime } from '@packages/utils/dates';
import Image from 'next/image';
import Link from 'next/link';

export function DeveloperInfoGithubActivities({ githubActivities }: { githubActivities: DeveloperGithubActivity[] }) {
  const isDesktop = useMdScreen();

  return (
    <Stack
      bgcolor='background.dark'
      borderRadius={1}
      p={{
        xs: 0.5,
        md: 1
      }}
      gap={0.5}
      minWidth={175}
      flex={1}
    >
      <Typography color='secondary.main'>Github Activity</Typography>
      <Stack>
        {githubActivities.length > 0 ? (
          githubActivities.map((activity) => (
            <Link
              onClick={(e) => {
                e.stopPropagation();
              }}
              href={activity.url}
              key={activity.url}
              target='_blank'
              rel='noopener noreferrer'
            >
              <Stack key={activity.url} direction='row' gap={0.75} alignItems='center' justifyContent='space-between'>
                <Avatar src={activity.avatar} name={activity.repo} size='xSmall' variant='rounded' />
                <Typography
                  variant={isDesktop ? 'h6' : 'body1'}
                  width={{
                    xs: '65%',
                    md: '75%'
                  }}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {activity.repo}
                </Typography>
                <Stack
                  width={{
                    xs: '20%',
                    md: '15%'
                  }}
                  justifyContent='flex-end'
                  direction='row'
                  gap={0.5}
                  alignItems='center'
                >
                  <Typography>{activity.gems}</Typography>
                  <Image
                    src='/images/icons/gem.svg'
                    width={isDesktop ? '20' : '16'}
                    height={isDesktop ? '20' : '16'}
                    alt='gem icon'
                  />
                </Stack>
                <Stack
                  width={{
                    xs: '15%',
                    md: '10%'
                  }}
                  justifyContent='flex-end'
                  flexDirection='row'
                >
                  <Typography>{getShortenedRelativeTime(activity.createdAt)}</Typography>
                </Stack>
              </Stack>
            </Link>
          ))
        ) : (
          <Typography>No activity in the last 30 days.</Typography>
        )}
      </Stack>
    </Stack>
  );
}
