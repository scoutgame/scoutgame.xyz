import { Button, Container, Stack, Typography } from '@mui/material';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import Image from 'next/image';
import Link from 'next/link';

import { InfoPageFooter } from 'components/info/components/InfoPageFooter';
import { InfoPageContent } from 'components/info/InfoPage';

import { CountdownTimer } from './CountdownTimer';

function HeroSection() {
  return (
    <Stack>
      <Stack
        flexDirection={{
          xs: 'column',
          md: 'row'
        }}
        mb={{
          xs: 4,
          md: 6
        }}
        justifyContent='space-between'
        alignItems='flex-end'
      >
        <Stack gap={2}>
          <Typography variant='h4' fontWeight={500} textAlign='center'>
            Season 1 Begins
          </Typography>
          <CountdownTimer />
        </Stack>
        <Stack p={2.5} borderRadius={1.5} gap={2} justifyContent='center' bgcolor='#1B2653'>
          <Typography variant='h6'>Happening NOW...</Typography>
          <Button variant='contained' color='primary' sx={{ px: 2, py: 1, borderRadius: 1.5, minWidth: 200 }}>
            <Link href='https://airdrop.scoutgame.xyz'>Claim Airdrop</Link>
          </Button>
          <Button variant='blue' sx={{ px: 2, py: 1, borderRadius: 1.5, minWidth: 200 }}>
            <Link href='/draft'>Play Scout Game</Link>
          </Button>
        </Stack>
      </Stack>
      <Stack>
        <Typography variant='h4' textAlign='center' color='secondary' fontWeight={500}>
          Build the Future, One Card at a Time
        </Typography>
        <Typography variant='h6' textAlign='center' my={2}>
          Collect a team of top developers and projects in the crypto ecosystem. <br /> Identify talent, support their
          open source work and earn Rewards.
        </Typography>
        <img
          src='/images/home/characters.png'
          alt='Cool dev'
          style={{
            marginLeft: 10,
            marginRight: 10
          }}
        />
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
    <Stack position='relative' alignItems='center' gap={2} py={{ xs: 0, md: 4 }}>
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
          <Button variant='contained' sx={{ px: 2, py: 1, borderRadius: 1.5, minWidth: 200 }}>
            <Link href='https://airdrop.scoutgame.xyz'>Claim Airdrop</Link>
          </Button>
          <Button variant='blue' sx={{ px: 2, py: 1, borderRadius: 1.5, minWidth: 200 }}>
            <Link href='/draft'>Play Scout Game</Link>
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

export function SeasonOneLandingPage() {
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
      <FooterSection />
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
