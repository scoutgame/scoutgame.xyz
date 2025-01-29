import type { StackProps } from '@mui/material';
import { Button, Container, Paper, Stack, Typography } from '@mui/material';
import { builderLoginUrl } from '@packages/scoutgame/constants';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { InfoPageFooter } from '../info/components/InfoPageFooter';

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
  additionalContent,
  activeBorder
}: {
  stepNumber: string;
  title: string;
  description: string | React.ReactNode;
  iconSrc: string;
  additionalContent?: React.ReactNode;
  activeBorder?: boolean;
}) {
  return (
    <ContainerStack
      sx={{
        flexDirection: additionalContent ? 'column' : 'row',
        ...(activeBorder ? { borderColor: 'secondary.main', borderStyle: 'solid', borderWidth: 2 } : {})
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

function HeroSection({
  heroSubtitle,
  heroImage,
  partnerUtmCampaign
}: {
  heroSubtitle: ReactNode;
  heroImage: string;
  partnerUtmCampaign: string;
}) {
  return (
    <Stack
      sx={{
        backgroundImage: {
          xs: undefined,
          md: 'url(/images/home/landing-bg.png)'
        },
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <Container
        maxWidth='lg'
        sx={{
          p: 0
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
                {heroSubtitle}
              </Typography>
            </Hidden>
            <Hidden mdDown>
              <Typography variant='h5' textAlign='left'>
                {heroSubtitle}
              </Typography>
            </Hidden>
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
              <Link href={`${builderLoginUrl}&utm_source=partner&utm_campaign=${partnerUtmCampaign}`}>Get started</Link>
            </Button>
          </Stack>
          <Hidden mdDown>
            <Image src={heroImage} width={350} height={350} alt='Cool dev' />
          </Hidden>
          <Hidden mdUp>
            <Image src={heroImage} width={250} height={250} alt='Cool dev' />
          </Hidden>
        </Stack>
      </Container>
    </Stack>
  );
}

export function HowToPlaySection({
  title = 'How to Play',
  activeBorder = false
}: {
  title?: string;
  activeBorder?: boolean;
}) {
  return (
    <Stack alignItems='center' mt={3}>
      <Typography variant='h4' color='secondary' fontWeight={500}>
        {title}
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
          description="Connect your GitHub and let us verify your open-source contributions. Once you're approved, your Developer Card goes live, and you're in the game!"
          iconSrc='/images/home/github-icon.svg'
          activeBorder={activeBorder}
        />
        <Step
          stepNumber='Step 2'
          title='Collect Gems Weekly'
          description='Earn Gems every week by tackling issues in qualified open-source projects. Contributions earn you 1, 10, 30, or even 100 Gems based on their impact. More Gems mean higher rank!'
          iconSrc='/images/home/code-icon.svg'
          activeBorder={activeBorder}
        />
        <Step
          stepNumber='Step 3'
          title='Earn Rewards'
          description="Every week is a fresh leaderboard battle. Rank high and earn Scout Points to showcase your skills. You'll also get 20% of the revenue from Developer Card sales, boosting your rewards!"
          iconSrc='/images/home/trophy-icon.svg'
          activeBorder={activeBorder}
        />
        <Step
          stepNumber='Step 4'
          title='Earn Tokens'
          description='Turn your skills into rewards. Collect tokens and prizes from top partners like Celo and Optimism for your contributions to the ecosystem.'
          iconSrc='/images/home/quests-icon.svg'
          activeBorder={activeBorder}
        />
      </Container>
    </Stack>
  );
}

function PartnerRewardsSection({
  partnerName,
  partnerBanner,
  partnerInfoLink,
  accentColor,
  partnerRewardsText
}: {
  partnerName: string;
  partnerBanner: string;
  partnerInfoLink: string;
  accentColor: string;
  partnerRewardsText: string;
}) {
  return (
    <Paper
      sx={{
        bgcolor: 'background.dark',
        py: {
          xs: 0,
          md: 4
        },
        pb: {
          xs: 2
        },
        mb: {
          xs: 2,
          md: 0
        }
      }}
    >
      <Container maxWidth='lg' sx={{ px: { xs: 0, md: 4 } }}>
        <Stack
          alignItems='center'
          gap={3}
          flexDirection={{
            xs: 'column',
            md: 'row'
          }}
          justifyContent='center'
        >
          <img src={partnerBanner} width='100%' style={{ maxWidth: 750, objectFit: 'cover' }} alt='Partner banner' />
          <Stack gap={2} alignItems='center' sx={{ px: { xs: 2, md: 0 } }}>
            <Typography variant='h4' color={accentColor} fontWeight={500} textAlign='center'>
              Scout Game + {partnerName}
            </Typography>
            <Typography variant='h6' fontWeight={500}>
              {partnerRewardsText}
            </Typography>
            <Button variant='outlined' sx={{ px: 2, borderColor: accentColor }}>
              <Link href={partnerInfoLink}>
                <Typography color={accentColor}>Learn more</Typography>
              </Link>
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Paper>
  );
}

function FooterSection({ partnerUtmCampaign }: { partnerUtmCampaign: string }) {
  return (
    <Stack
      position='relative'
      alignItems='center'
      gap={2}
      py={{ xs: 0, md: 4 }}
      mb={{ xs: 4, md: 0 }}
      sx={{
        backgroundImage: {
          xs: undefined,
          md: 'url(/images/home/landing-bg.png)'
        },
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Stack mx='auto' justifyContent='center' alignItems='center' gap={2}>
        <Typography variant='h6' textAlign='center'>
          Write code & earn rewards! <br /> Join Scout Game!
        </Typography>
        <Button variant='contained' sx={{ width: '50%' }}>
          <Link href={`${builderLoginUrl}&utm_source=partner&utm_campaign=${partnerUtmCampaign}`}>Get started</Link>
        </Button>
      </Stack>
    </Stack>
  );
}

export function PartnerLandingPage({
  heroSubtitle,
  heroImage,
  partnerName,
  partnerBanner,
  partnerInfoLink,
  accentColor,
  partnerRewardsText,
  partnerUtmCampaign
}: {
  heroSubtitle: ReactNode;
  heroImage: string;
  partnerName: string;
  partnerBanner: string;
  partnerInfoLink: string;
  accentColor: string;
  partnerRewardsText: string;
  partnerUtmCampaign: string;
}) {
  return (
    <Stack
      height='100%'
      overflow='hidden'
      sx={{
        backgroundImage: 'url(/images/home/starry-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Stack height='100%' overflow='auto'>
        <HeroSection heroSubtitle={heroSubtitle} heroImage={heroImage} partnerUtmCampaign={partnerUtmCampaign} />
        <HowToPlaySection />
        <PartnerRewardsSection
          partnerName={partnerName}
          partnerBanner={partnerBanner}
          partnerInfoLink={partnerInfoLink}
          accentColor={accentColor}
          partnerRewardsText={partnerRewardsText}
        />
        <FooterSection partnerUtmCampaign={partnerUtmCampaign} />
        <InfoPageFooter />
      </Stack>
    </Stack>
  );
}
