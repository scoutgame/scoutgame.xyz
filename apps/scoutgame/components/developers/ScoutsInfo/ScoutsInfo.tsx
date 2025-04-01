'use client';

import { Button, Stack, Typography } from '@mui/material';
import { builderLoginUrl } from '@packages/scoutgame/constants';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { useGlobalModal } from '@packages/scoutgame-ui/providers/ModalProvider';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { InfoPageFooter } from 'components/info/components/InfoPageFooter';

import { HowToPlaySection } from '../../partners/PartnerLandingPage';

function FooterSection() {
  const { openModal } = useGlobalModal();
  const { user } = useUser();
  const router = useRouter();

  const handleButtonClick = () => {
    if (user) {
      openModal('newBuilder');
    } else {
      router.push(builderLoginUrl);
    }
  };

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
          Write code & earn rewards! <br /> Join Scout Game.
        </Typography>
        <Button
          onClick={handleButtonClick}
          color='primary'
          sx={{ cursor: 'pointer', width: 200, textAlign: 'center', fontWeight: 400, margin: '0 auto' }}
        >
          Get Started
        </Button>
      </Stack>
    </Stack>
  );
}

export function ScoutsInfo() {
  return (
    <Stack height='100%'>
      <HowToPlaySection title='Scout Game for Developers' activeBorder />
      <FooterSection />
      <Stack>
        <InfoPageFooter />
      </Stack>
    </Stack>
  );
}
