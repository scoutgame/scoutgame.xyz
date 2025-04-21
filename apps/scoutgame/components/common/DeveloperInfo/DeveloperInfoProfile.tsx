import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Button, IconButton, Stack, Typography } from '@mui/material';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { DateTime } from 'luxon';
import Image from 'next/image';
import Link from 'next/link';

export function DeveloperInfoProfile({
  firstContributionDate: _firstContributionDate,
  githubConnectedAt: _githubConnectedAt,
  displayName,
  path,
  avatar,
  githubLogin,
  farcasterUsername,
  onClose,
  level,
  hidePathLink = false
}: {
  firstContributionDate: Date;
  githubConnectedAt: Date;
  displayName: string;
  path: string;
  level: number;
  avatar: string;
  githubLogin: string | null;
  farcasterUsername: string | null;
  onClose: () => void;
  hidePathLink?: boolean;
}) {
  const isDesktop = useMdScreen();
  const firstContributionDate = DateTime.fromISO(_firstContributionDate.toISOString());
  const firstContributionDateMonth = firstContributionDate.monthShort;
  const firstContributionDateYear = firstContributionDate.year;

  const githubConnectedAt = DateTime.fromISO(_githubConnectedAt.toISOString());
  const githubConnectedAtMonth = githubConnectedAt.monthShort;
  const githubConnectedAtYear = githubConnectedAt.year;

  return (
    <Stack direction='row' alignItems='center' gap={2}>
      <Stack position='relative'>
        <Avatar src={avatar} name={displayName} size={isDesktop ? 'xLarge' : 'large'} variant='circular' />
        <Stack
          sx={{
            position: 'absolute',
            width: {
              xs: 32,
              md: 40
            },
            height: {
              xs: 32,
              md: 40
            },
            bottom: {
              xs: -8,
              md: -10
            },
            right: {
              xs: -8,
              md: -10
            },
            backgroundColor: 'orange.main',
            borderRadius: '50%',
            border: '1.5px solid #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography
            fontFamily='Jura'
            fontSize={{
              xs: 10,
              md: 12
            }}
            color='black.main'
            lineHeight={1}
            mb={0.25}
          >
            lv
          </Typography>
          <Typography
            fontFamily='Jura'
            fontSize={{
              xs: 12,
              md: 18
            }}
            fontWeight='bold'
            color='black.main'
            lineHeight={1}
          >
            {level}
          </Typography>
        </Stack>
      </Stack>
      <Stack>
        <Stack
          direction='row'
          alignItems='center'
          gap={{
            xs: 0.5,
            md: 1
          }}
        >
          <Typography
            variant={isDesktop ? 'h5' : 'h6'}
            maxWidth={{
              xs: 150,
              md: 250
            }}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {displayName}
          </Typography>
          {!hidePathLink ? (
            <Link href={`/u/${path}`} onClick={onClose}>
              <Button
                sx={{
                  p: 0,
                  '& .MuiButton-startIcon': {
                    mr: 0.5
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: {
                      xs: 12,
                      md: 14
                    }
                  }
                }}
                variant='text'
                startIcon={<OpenInNewIcon sx={{ fontSize: { xs: '12px !important', md: '14px !important' } }} />}
                color='secondary'
                size='small'
              >
                <Typography color='secondary' fontSize='12px'>
                  View {isDesktop ? 'Profile' : ''}
                </Typography>
              </Button>
            </Link>
          ) : null}
        </Stack>
        <Typography color='secondary'>Joined</Typography>
        <Stack
          direction='row'
          alignItems='center'
          gap={{
            xs: 1,
            md: 1.75
          }}
        >
          <Stack
            direction='row'
            gap={{
              xs: 0.5,
              md: 1
            }}
            alignItems='center'
          >
            <Image
              src='/images/icons/binoculars.svg'
              width={isDesktop ? '24' : '18'}
              height={isDesktop ? '24' : '18'}
              alt='scoutgame icon'
            />
            <Typography
              fontSize={{
                xs: 14
              }}
            >
              {firstContributionDateMonth} {firstContributionDateYear}
            </Typography>
          </Stack>
          {githubLogin ? (
            <IconButton
              href={`https://github.com/${githubLogin}`}
              onClick={(e) => {
                e.stopPropagation();
              }}
              target='_blank'
              rel='noopener noreferrer'
              sx={{ p: 0 }}
            >
              <Stack direction='row' gap={1} alignItems='center'>
                <Image
                  src='/images/profile/icons/github-circle-icon.svg'
                  width={isDesktop ? '18' : '14'}
                  height={isDesktop ? '18' : '14'}
                  alt='github icon'
                />
                <Typography
                  fontSize={{
                    xs: 14
                  }}
                >
                  {githubConnectedAtMonth} {githubConnectedAtYear}
                </Typography>
              </Stack>
            </IconButton>
          ) : null}
          {farcasterUsername ? (
            <IconButton
              href={`https://warpcast.com/${farcasterUsername}`}
              target='_blank'
              rel='noopener noreferrer'
              sx={{
                p: 0
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Stack direction='row' gap={1} alignItems='center'>
                <Image
                  src='/images/profile/icons/warpcast-circle-icon.svg'
                  width={isDesktop ? '18' : '14'}
                  height={isDesktop ? '18' : '14'}
                  alt='warpcast icon'
                />
                <Typography
                  sx={{
                    fontSize: {
                      xs: 14
                    },
                    maxWidth: {
                      xs: 90
                    },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {farcasterUsername}
                </Typography>
              </Stack>
            </IconButton>
          ) : null}
        </Stack>
      </Stack>
    </Stack>
  );
}
