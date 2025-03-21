import { BuilderNftType } from '@charmverse/core/prisma-client';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Button, IconButton, Stack, Typography } from '@mui/material';
import { type DeveloperInfo } from '@packages/scoutgame/builders/getDeveloperInfo';
import { getShortenedRelativeTime } from '@packages/utils/dates';
import { DateTime } from 'luxon';
import Image from 'next/image';
import Link from 'next/link';

import { useMdScreen } from '../../../hooks/useMediaScreens';
import { useUser } from '../../../providers/UserProvider';
import { Avatar } from '../Avatar';
import { BuilderCardRankGraph } from '../Card/BuilderCard/BuilderCardActivity/BuilderCardRankGraph';
import { Dialog } from '../Dialog';
import { ScoutButton } from '../ScoutButton/ScoutButton';

import { DeveloperInfoModalSkeleton } from './DeveloperInfoModalSkeleton';

function DeveloperCardSection({
  cardType,
  estimatedPayout,
  cardsSold,
  cardsSoldToScout,
  onClose,
  developerId,
  displayName,
  avatar,
  nftImageUrl,
  congratsImageUrl,
  cardPrice,
  path
}: {
  cardType: BuilderNftType;
  estimatedPayout: number;
  cardsSold: number;
  cardsSoldToScout: number;
  onClose: VoidFunction;
  developerId: string;
  displayName: string;
  avatar: string;
  nftImageUrl: string | null;
  congratsImageUrl: string | null;
  cardPrice: bigint;
  path: string;
}) {
  const isDesktop = useMdScreen();
  const color = cardType === BuilderNftType.starter_pack ? 'green.main' : 'secondary.main';
  const { user } = useUser();

  return (
    <Stack
      bgcolor='primary.dark'
      p={{
        xs: 0.5,
        md: 1
      }}
      borderRadius={1}
      gap={0.5}
      flex={1}
    >
      <Stack flexDirection='row' gap={0.5} alignItems='center' justifyContent='space-between'>
        <Typography color={color}>
          {cardType === BuilderNftType.starter_pack ? 'STARTER CARD' : 'REGULAR CARD'}
        </Typography>
        <Stack direction='row' gap={0.75} alignItems='center'>
          {user ? (
            <>
              <Typography color={color}>
                {cardsSoldToScout} of {cardsSold}
              </Typography>
              <Image
                src={
                  cardType === BuilderNftType.starter_pack
                    ? '/images/profile/icons/cards-green.svg'
                    : '/images/profile/icons/cards-secondary.svg'
                }
                width={17.5}
                height={17.5}
                alt='cards sold icon'
              />
              <Typography color={color}>Held</Typography>
            </>
          ) : (
            <>
              <Typography color={color}>{cardsSold}</Typography>
              <Image
                src={
                  cardType === BuilderNftType.starter_pack
                    ? '/images/profile/icons/cards-green.svg'
                    : '/images/profile/icons/cards-secondary.svg'
                }
                width={17.5}
                height={17.5}
                alt='cards sold icon'
              />
            </>
          )}
        </Stack>
      </Stack>
      <Stack flexDirection='row' gap={0.5} alignItems='center' justifyContent='space-between'>
        <Stack>
          <Typography color={color}>Est. Payout</Typography>
          <Stack direction='row' gap={0.5} alignItems='center'>
            <Typography variant={isDesktop ? 'h6' : 'body1'}>{estimatedPayout}</Typography>
            <Image
              src='/images/profile/scout-game-profile-icon.png'
              width={isDesktop ? 24 : 18.5}
              height={isDesktop ? 15.5 : 12}
              alt='scoutgame icon'
            />
          </Stack>
        </Stack>
        <Stack
          gap={0.5}
          onClick={() => {
            onClose();
          }}
        >
          <ScoutButton
            builder={{
              builderStatus: 'applied',
              id: developerId,
              displayName,
              path,
              price: cardPrice,
              nftImageUrl,
              avatar,
              congratsImageUrl
            }}
            type={cardType}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}

export function DeveloperInfoModal({
  onClose,
  developer,
  isLoading
}: {
  onClose: () => void;
  developer: DeveloperInfo | null;
  isLoading: boolean;
}) {
  const isDesktop = useMdScreen();

  if (isLoading) {
    return (
      <Dialog
        open
        onClose={onClose}
        sx={{
          '& .MuiDialogContent-root': {
            p: {
              xs: 1,
              md: 2
            }
          },
          '& .MuiDialog-paper': {
            pt: {
              xs: 1,
              md: 2
            },
            minWidth: {
              xs: '100%',
              md: 600
            },
            bgcolor: 'black.main',
            borderRadius: 2
          }
        }}
      >
        <DeveloperInfoModalSkeleton />
      </Dialog>
    );
  }

  if (!developer) {
    return null;
  }

  const firstContributionDate = DateTime.fromISO(developer.firstContributionDate.toISOString());
  const firstContributionDateMonth = firstContributionDate.monthShort;
  const firstContributionDateYear = firstContributionDate.year;

  const githubConnectedAt = DateTime.fromISO(developer.githubConnectedAt.toISOString());
  const githubConnectedAtMonth = githubConnectedAt.monthShort;
  const githubConnectedAtYear = githubConnectedAt.year;

  return (
    <Dialog
      open
      onClose={onClose}
      sx={{
        '& .MuiDialogContent-root': {
          p: {
            xs: 1
          }
        },
        '& .MuiDialog-paper': {
          minWidth: {
            xs: '100%',
            md: 600
          },
          bgcolor: 'black.main',
          borderRadius: 2
        }
      }}
    >
      <Stack gap={2}>
        <Stack direction='row' alignItems='center' gap={2}>
          <Stack position='relative'>
            <Avatar
              src={developer.avatar}
              name={developer.displayName}
              size={isDesktop ? 'xLarge' : 'large'}
              variant='circular'
            />
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
                {developer.level}
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
                {developer.displayName}
              </Typography>
              <Link href={`/u/${developer.path}`} onClick={onClose}>
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
              {developer.githubLogin ? (
                <IconButton
                  href={`https://github.com/${developer.githubLogin}`}
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
              {developer.farcasterUsername ? (
                <IconButton
                  href={`https://warpcast.com/${developer.farcasterUsername}`}
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
                      {developer.farcasterUsername}
                    </Typography>
                  </Stack>
                </IconButton>
              ) : null}
            </Stack>
          </Stack>
        </Stack>
        <Stack gap={0.5}>
          <Stack direction='row' gap={0.5}>
            <Stack
              bgcolor='primary.dark'
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
                <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.rank}</Typography>
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
                  <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.gemsCollected}</Typography>
                  <Image
                    src='/images/icons/gem.svg'
                    width={isDesktop ? '24' : '18'}
                    height={isDesktop ? '24' : '18'}
                    alt='gem icon'
                  />
                </Stack>
              </Stack>
            </Stack>
            <Stack
              bgcolor='primary.dark'
              borderRadius={1}
              flex={1}
              height={{
                xs: 115,
                md: 140
              }}
            >
              <Typography
                color='secondary.main'
                p={{
                  xs: 0.5,
                  md: 1
                }}
              >
                14D Rank
              </Typography>
              <Stack height='calc(100% - 16px)'>
                <BuilderCardRankGraph last14DaysRank={developer.last14DaysRank} />
              </Stack>
            </Stack>
            <Stack
              bgcolor='primary.dark'
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
                  This
                </Typography>{' '}
                Season
              </Typography>
              <Stack>
                <Stack direction='row' gap={0.5} alignItems='center'>
                  <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.seasonPoints}</Typography>
                  <Image
                    src='/images/icons/binoculars.svg'
                    width={isDesktop ? '24' : '18'}
                    height={isDesktop ? '24' : '18'}
                    alt='gem icon'
                  />
                </Stack>
                <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.scoutedBy} Scouts</Typography>
                <Stack direction='row' gap={0.5} alignItems='center'>
                  <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.cardsSold}</Typography>
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
          </Stack>
          <Stack
            bgcolor='primary.dark'
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
              {developer.githubActivities.length > 0 ? (
                developer.githubActivities.map((activity) => (
                  <Link
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    href={activity.url}
                    key={activity.url}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <Stack
                      key={activity.url}
                      direction='row'
                      gap={0.75}
                      alignItems='center'
                      justifyContent='space-between'
                    >
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
          <Stack
            direction={{
              xs: 'column',
              md: 'row'
            }}
            gap={0.5}
          >
            <DeveloperCardSection
              developerId={developer.id}
              displayName={developer.displayName}
              avatar={developer.avatar}
              nftImageUrl={developer.starterCard.nftImageUrl}
              congratsImageUrl={developer.starterCard.congratsImageUrl}
              cardPrice={developer.starterCard.price}
              path={developer.path}
              cardType={BuilderNftType.starter_pack}
              estimatedPayout={developer.starterCard.estimatedPayout}
              cardsSold={developer.starterCard.cardsSold}
              cardsSoldToScout={developer.starterCard.cardsSoldToScout}
              onClose={onClose}
            />

            <DeveloperCardSection
              developerId={developer.id}
              displayName={developer.displayName}
              avatar={developer.avatar}
              nftImageUrl={developer.regularCard.nftImageUrl}
              congratsImageUrl={developer.regularCard.congratsImageUrl}
              cardPrice={developer.regularCard.price}
              path={developer.path}
              cardType={BuilderNftType.default}
              estimatedPayout={developer.regularCard.estimatedPayout}
              cardsSold={developer.regularCard.cardsSold}
              cardsSoldToScout={developer.regularCard.cardsSoldToScout}
              onClose={onClose}
            />
          </Stack>
        </Stack>
      </Stack>
    </Dialog>
  );
}
