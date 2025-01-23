'use client';

import type { StackProps } from '@mui/material';
import { Button, Container, Stack, Typography } from '@mui/material';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { InfoPageFooter } from '@packages/scoutgame-ui/components/info/components/InfoPageFooter';
import Image from 'next/image';

import { useGlobalModal } from '../../../providers/ModalProvider';

function ContainerStack({ children, ...props }: { children: React.ReactNode } & StackProps) {
  return (
    <Stack
      {...props}
      sx={{
        p: {
          xs: 1,
          md: 4
        },
        my: {
          xs: 2,
          md: 3
        },
        width: '100%',
        bgcolor: 'background.dark',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 1.5,
        ...props.sx
      }}
    >
      {children}
    </Stack>
  );
}

function Step({
  stepNumber,
  title,
  description,
  iconSrc,
  additionalContent
}: {
  stepNumber: string;
  title: string;
  description: string | React.ReactNode;
  iconSrc: string;
  additionalContent?: React.ReactNode;
}) {
  return (
    <ContainerStack
      sx={{
        flexDirection: additionalContent ? 'column' : 'row',
        borderColor: 'secondary.main',
        borderStyle: 'solid',
        borderWidth: 2
      }}
    >
      <Stack
        flexDirection='row'
        width='100%'
        alignItems={{
          xs: 'flex-start',
          md: 'center'
        }}
        gap={1}
      >
        <Stack
          gap={1}
          alignItems='center'
          width={{
            xs: '20%',
            md: '35%'
          }}
          position='relative'
          top={{
            xs: 3.5,
            md: 0
          }}
        >
          <Typography color='secondary'>{stepNumber}</Typography>
          <Hidden mdDown>
            <Image width={85} height={85} src={iconSrc} alt={stepNumber} />
          </Hidden>
          <Hidden mdUp>
            <Image width={50} height={50} src={iconSrc} alt={stepNumber} />
          </Hidden>
        </Stack>
        <Stack width={{ xs: '80%', md: '65%' }} gap={1}>
          <Typography variant='h5' color='secondary'>
            {title}
          </Typography>
          <Typography>{description}</Typography>
        </Stack>
      </Stack>
      {additionalContent}
    </ContainerStack>
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
        <Typography variant='h5' color='secondary' textAlign='center' my={1}>
          Scout Game for Developers
        </Typography>
        <Container
          maxWidth='lg'
          sx={{
            p: 0
          }}
        >
          <Step
            stepNumber='Step 1'
            title='Sign Up & Apply'
            description="Connect your GitHub and let us verify your open source contributions. Once you make your first qualified contribution, you're approved. Your Developer Card goes live, and you're in the game!"
            iconSrc='/images/home/github-icon.svg'
          />
          <Step
            stepNumber='Step 2'
            title='Collect Gems Weekly'
            description='Earn Gems every week by tackling issues in qualified open-source projects. Contributions earn you 1, 10, 30, or even 100 Gems based on their impact. More Gems mean higher rank!'
            iconSrc='/images/home/code-icon.svg'
          />
          <Step
            stepNumber='Step 3'
            title='Earn Rewards'
            description='Every week is a fresh leaderboard battle. Rank high and earn Scout Points to showcase your skills. You’ll also get 20% of your Developer Card sales, boosting your rewards!'
            iconSrc='/images/home/trophy-icon.svg'
          />
          <Step
            stepNumber='Step 4'
            title='Earn Tokens'
            description='Turn your skills into rewards. Collect tokens and prizes from top partners like Celo and Optimism for your contributions to the ecosystem.'
            iconSrc='/images/home/quests-icon.svg'
          />
        </Container>
      </Stack>
    </Stack>
  );
}

function FooterSection() {
  const { openModal } = useGlobalModal();

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
          onClick={() => openModal('newBuilder')}
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
      <HowToPlaySection />
      <FooterSection />
      <Stack>
        <InfoPageFooter />
      </Stack>
    </Stack>
  );
}
