import type { ButtonProps } from '@mui/material';
import { Button, Container, Stack, Typography } from '@mui/material';
import { isDraftSeason } from '@packages/dates/utils';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import Image from 'next/image';
import Link from 'next/link';

import { InfoPageFooter } from 'components/info/components/InfoPageFooter';
import { InfoPageContent } from 'components/info/InfoPage';
import { isAirdropLive } from 'lib/airdrop/checkAirdropDates';

import { CountdownTimer } from './CountdownTimer';

function CustomButton({ children, ...props }: ButtonProps & { href: string }) {
  return (
    <Button
      component={Link}
      variant='contained'
      color='primary'
      sx={{
        px: { xs: 1, md: 2 },
        py: { xs: 0.5, md: 1 },
        borderRadius: { xs: 1, md: 1.5 },
        minWidth: { xs: 150, md: 200 }
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

async function HeroSection() {
  const airdropLive = isAirdropLive();
  const draftSeason = isDraftSeason();

  if (!draftSeason) {
    return (
      <Stack alignItems='center'>
        <Stack
          justifyContent='space-between'
          flexDirection={{
            xs: 'column-reverse',
            md: 'row'
          }}
          alignItems='center'
          gap={2}
          p={{
            xs: 2
          }}
        >
          <Stack flex={1} alignItems={{ xs: 'center', md: 'flex-start' }}>
            <Typography variant='h3' textAlign={{ xs: 'center', md: 'left' }} color='secondary' fontWeight={500}>
              Build the Future, <br /> One Card at a Time
            </Typography>
            <Typography variant='h6' my={2} textAlign={{ xs: 'center', md: 'left' }}>
              Collect a team of top developers and projects in the crypto ecosystem. <br />
              Identify talent, support their open source work and earn Rewards.
            </Typography>
            <Button
              variant='contained'
              color='primary'
              size='large'
              href='/scout'
              sx={{ width: 'fit-content', minWidth: 150, py: 1, mb: 4 }}
            >
              Play
            </Button>
          </Stack>
          <Stack flex={1} alignItems='flex-end'>
            <Hidden mdDown>
              <Image src='/images/scout-switch.png' alt='Scout Game Switch' width={400} height={400} />
            </Hidden>
            <Hidden mdUp>
              <Image src='/images/scout-switch.png' alt='Scout Game Switch' width={300} height={300} />
            </Hidden>
          </Stack>
        </Stack>

        <Stack>
          <Hidden mdDown>
            <Image
              src='/images/home/characters.png'
              alt='Characters'
              width={500}
              height={500}
              style={{
                marginLeft: 10,
                marginRight: 10,
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </Hidden>
          <Hidden mdUp>
            <Stack justifyContent='center' alignItems='center' width='100%' height='100%'>
              <Image
                src='/images/home/characters.png'
                alt='Characters'
                width={300}
                height={300}
                style={{
                  width: '85%',
                  height: '85%',
                  objectFit: 'contain'
                }}
              />
            </Stack>
          </Hidden>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack alignItems='center' mt={6}>
      <Stack
        flexDirection={{
          xs: 'column',
          md: 'row'
        }}
        mb={{
          xs: 4,
          md: 6
        }}
        gap={{
          xs: 2,
          md: 10
        }}
        maxWidth='md'
        justifyContent='center'
        alignItems='center'
      >
        {airdropLive ? (
          <>
            <Stack gap={2} alignItems='center'>
              <Typography variant='h4' fontWeight={500} textAlign='center'>
                Season 1 Begins
              </Typography>
              <CountdownTimer />
            </Stack>
            <Stack
              p={{
                xs: 1.5,
                md: 2.5
              }}
              borderRadius={{
                xs: 1,
                md: 2
              }}
              gap={{
                xs: 1,
                md: 2
              }}
              width={{
                xs: '100%'
              }}
              justifyContent='center'
              alignItems='center'
              bgcolor='#1B2653'
              mt={{
                xs: 1,
                md: 7
              }}
            >
              <Typography variant='h6' textAlign='center'>
                Happening NOW...
              </Typography>
              <CustomButton variant='contained' color='primary' href='/airdrop'>
                Claim Airdrop
              </CustomButton>
            </Stack>
          </>
        ) : (
          <Stack>
            <Typography variant='h3' textAlign='center' color='secondary' fontWeight={500}>
              Prepare for Season 1
            </Typography>
            <Typography variant='h5' textAlign='center' my={2}>
              The Scout Game Offseason Begins on Monday, April 21 @ 11 AM EST
            </Typography>
          </Stack>
        )}
      </Stack>
      <Stack>
        <Typography variant='h4' textAlign='center' color='secondary' fontWeight={500}>
          Build the Future, One Card at a Time
        </Typography>
        <Typography variant='h6' textAlign='center' my={2}>
          Collect a team of top developers and projects in the crypto ecosystem. <br /> Identify talent, support their
          open source work and earn Rewards.
        </Typography>
        <Hidden mdDown>
          <Image
            src='/images/home/characters.png'
            alt='Characters'
            width={500}
            height={500}
            style={{
              marginLeft: 10,
              marginRight: 10,
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </Hidden>
        <Hidden mdUp>
          <Stack justifyContent='center' alignItems='center' width='100%' height='100%'>
            <Image
              src='/images/home/characters.png'
              alt='Characters'
              width={300}
              height={300}
              style={{
                width: '85%',
                height: '85%',
                objectFit: 'contain'
              }}
            />
          </Stack>
        </Hidden>
      </Stack>
    </Stack>
  );
}

function HowToPlaySection() {
  return (
    <Stack position='relative'>
      <Stack
        zIndex={{
          xs: 0,
          md: 1
        }}
        alignItems='center'
        mt={3}
      >
        <Typography variant='h4' color='secondary' fontWeight={500}>
          How to Play
        </Typography>
        <InfoPageContent hideDeveloperCard />
      </Stack>
    </Stack>
  );
}

function FooterSection() {
  const draftSeason = isDraftSeason();

  if (!draftSeason) {
    return (
      <Stack position='relative' alignItems='center' gap={2} py={{ xs: 0, md: 4 }} mb={{ xs: 4, md: 0 }}>
        <Hidden mdDown>
          <Image
            src='/images/home/landing-bg.png'
            width='500'
            height='250'
            alt='footer bg'
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
        </Hidden>
        <Stack
          mx='auto'
          zIndex={{
            xs: 0,
            md: 1
          }}
          justifyContent='center'
          alignItems='center'
          gap={2}
        >
          <Typography variant='h6' textAlign='center'>
            Pick great developers. Earn rewards. <br /> Everyone can play. No coding required!
          </Typography>
          <Button variant='contained' sx={{ width: '50%', py: 1 }}>
            <Link href='/login'>Play Scout Game</Link>
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack
      position='relative'
      alignItems='center'
      gap={2}
      py={{ xs: 0, md: 4 }}
      mb={{
        xs: 4,
        md: 0
      }}
    >
      <Hidden
        mdDown
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      >
        <Image
          src='/images/home/landing-bg.png'
          width='500'
          height='250'
          alt='footer bg'
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </Hidden>
      <Stack
        mx='auto'
        zIndex={{
          xs: 0,
          md: 1
        }}
        justifyContent='center'
        alignItems='center'
        gap={2}
      >
        <Typography variant='h6' textAlign='center'>
          Happening NOW...
        </Typography>
        <Stack
          flexDirection={{
            xs: 'column',
            md: 'row'
          }}
          gap={2}
        >
          <CustomButton href='/airdrop'>Claim Airdrop</CustomButton>
        </Stack>
      </Stack>
    </Stack>
  );
}

export async function SeasonOneLandingPage() {
  const airdropLive = isAirdropLive();

  return (
    <>
      <Container
        maxWidth='lg'
        sx={{
          p: 0,
          my: 4,
          mt: 4,
          zIndex: {
            xs: 0,
            md: 1
          }
        }}
      >
        <HeroSection />
        <HowToPlaySection />
      </Container>
      {airdropLive ? <FooterSection /> : null}
      <Stack
        zIndex={{
          xs: 0,
          md: 1
        }}
      >
        <InfoPageFooter />
      </Stack>
    </>
  );
}
