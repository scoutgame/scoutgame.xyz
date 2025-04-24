import type { ButtonProps } from '@mui/material';
import { Button, Container, Stack, Typography } from '@mui/material';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import Image from 'next/image';
import Link from 'next/link';

import { InfoPageFooter } from 'components/info/components/InfoPageFooter';
import { InfoPageContent } from 'components/info/InfoPage';
import { isAirdropLive } from 'lib/airdrop/checkAirdropDates';

import { CountdownTimer } from './CountdownTimer';

function CustomButton({ children, ...props }: ButtonProps) {
  return (
    <Button
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

  return (
    <Stack alignItems='center'>
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
        alignItems={{
          xs: 'center',
          md: 'flex-end'
        }}
      >
        {airdropLive ? (
          <>
            <Stack gap={2}>
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
              bgcolor='#1B2653'
            >
              <Typography variant='h6' textAlign='center'>
                Happening NOW...
              </Typography>
              <CustomButton variant='contained' color='primary'>
                <Link href='/airdrop'>Claim Airdrop</Link>
              </CustomButton>
              <CustomButton variant='blue'>
                <Link href='/draft'>Play Scout Game</Link>
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
          <CustomButton>
            <Link href='/airdrop'>Claim Airdrop</Link>
          </CustomButton>
          <CustomButton variant='blue'>
            <Link href='/draft'>Play Scout Game</Link>
          </CustomButton>
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
          mt: {
            xs: 4,
            md: 10
          },
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
