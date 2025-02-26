import { Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { InfoPageFooter } from '@packages/scoutgame-ui/components/info/components/InfoPageFooter';
import { InfoPageContent } from '@packages/scoutgame-ui/components/info/InfoPage';
import { getPlatform } from '@packages/utils/platform';
import Image from 'next/image';
import Link from 'next/link';

function HeroSection() {
  const platform = getPlatform();
  return (
    <Stack sx={{ position: 'relative' }}>
      <Hidden mdDown>
        <Image
          src='/images/home/landing-bg.png'
          width='500'
          height='350'
          alt='title icon'
          style={{
            width: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0
          }}
        />
      </Hidden>
      <Container
        maxWidth='lg'
        sx={{
          p: 0,
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
          <Stack
            gap={2}
            my={{
              xs: 2,
              md: 4
            }}
            mr={{
              xs: 0,
              md: 12
            }}
            justifyContent='center'
          >
            <Typography
              variant='h3'
              color='secondary'
              fontWeight={500}
              textAlign={{
                xs: 'center',
                md: 'left'
              }}
            >
              Fantasy Sports for <br /> Onchain Developers
            </Typography>
            <Hidden mdUp>
              <Typography variant='h6' textAlign='center'>
                Pick great developers. Earn rewards.
                <br />
                Everyone can play. No coding required!
              </Typography>
            </Hidden>
            <Hidden mdDown>
              <Typography variant='h5' textAlign='left'>
                Pick great developers. Earn rewards.
                <br />
                Everyone can play. No coding required!
              </Typography>
            </Hidden>

            {platform === 'farcaster' ? (
              <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' width='100%'>
                <CircularProgress size={20} />
                <Typography variant='h6'>Logging in...</Typography>
              </Stack>
            ) : (
              <Button
                variant='contained'
                sx={{
                  my: 2,
                  width: '50%',
                  mx: {
                    xs: 'auto',
                    md: 0
                  }
                }}
                data-test='get-started-button'
              >
                <Link href='/login'>Get started</Link>
              </Button>
            )}
          </Stack>
          <Hidden mdDown>
            <Image src='/images/home/cool-dev.png' width={350} height={350} alt='Cool dev' />
          </Hidden>
          <Hidden mdUp>
            <Image src='/images/home/cool-dev.png' width={250} height={250} alt='Cool dev' />
          </Hidden>
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
        <InfoPageContent />
      </Stack>
    </Stack>
  );
}

function FooterSection() {
  const platform = getPlatform();
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
        {platform !== 'farcaster' ? (
          <Button variant='contained' sx={{ width: '50%' }}>
            <Link href='/login'>Get started</Link>
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}

export function LandingPage() {
  return (
    <Stack height='100%' overflow='hidden'>
      <Image
        src='/images/home/starry-bg.png'
        width='500'
        height='350'
        alt='title icon'
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0
        }}
      />
      <Stack height='100%' overflow='auto'>
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
    </Stack>
  );
}
