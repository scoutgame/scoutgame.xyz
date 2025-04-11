import { Button, Container, Stack, Typography } from '@mui/material';
import Link from 'next/link';

import { InfoPageFooter } from 'components/info/components/InfoPageFooter';
import { InfoPageContent } from 'components/info/InfoPage';

function HeroSection() {
  return (
    <Stack sx={{ position: 'relative' }}>
      <Container
        maxWidth='lg'
        sx={{
          p: 0,
          my: 4,
          zIndex: {
            xs: 0,
            md: 1
          }
        }}
      >
        <Stack
          flexDirection={{
            xs: 'column',
            md: 'row'
          }}
          justifyContent='space-between'
          alignItems='center'
        >
          <Stack>
            <Typography variant='h5' fontWeight={500} textAlign='center'>
              Season 1 Begins
            </Typography>
          </Stack>
          <Stack
            p={2}
            borderRadius={1.5}
            gap={2}
            mb={4}
            justifyContent='center'
            alignItems='center'
            bgcolor='background.dark'
          >
            <Typography variant='h6'>Happening NOW...</Typography>
            <Button variant='contained' color='primary' sx={{ px: 2, py: 1, borderRadius: 1.5, minWidth: 200 }}>
              <Link href='https://airdrop.scoutgame.xyz'>Claim Airdrop</Link>
            </Button>
            <Button variant='blue' sx={{ px: 2, py: 1, borderRadius: 1.5, minWidth: 200 }}>
              <Link href='/draft'>Draft Developers</Link>
            </Button>
          </Stack>
        </Stack>
        <Stack>
          <Typography variant='h4' textAlign='center' color='secondary'>
            Build the Future, One Card at a Time
          </Typography>
          <Typography variant='h6' textAlign='center' my={2}>
            Collect a team of top developers and projects in the crypto ecosystem. <br /> Identify talent, support their
            open source work and earn Rewards.
          </Typography>
          <img src='/images/home/characters.png' alt='Cool dev' />
        </Stack>
      </Container>
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
    <Stack position='relative' alignItems='center' gap={2} py={{ xs: 0, md: 4 }} mb={{ xs: 4, md: 0 }}>
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
        <Stack flexDirection='row' gap={2}>
          <Button variant='contained' sx={{ px: 2, py: 1, borderRadius: 1.5, minWidth: 200 }}>
            <Link href='https://airdrop.scoutgame.xyz'>Claim Airdrop</Link>
          </Button>
          <Button variant='blue' sx={{ px: 2, py: 1, borderRadius: 1.5, minWidth: 200 }}>
            <Link href='/draft'>Draft Developers</Link>
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

export function SeasonOneLandingPage() {
  return (
    <Stack height='100%'>
      <HeroSection />
      <HowToPlaySection />
      <FooterSection />
      <Stack
        zIndex={{
          xs: 0,
          md: 1
        }}
      >
        <InfoPageFooter />
      </Stack>
    </Stack>
  );
}
