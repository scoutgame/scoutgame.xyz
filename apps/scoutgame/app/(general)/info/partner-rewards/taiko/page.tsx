import { prisma } from '@charmverse/core/prisma-client';
import type { StackProps } from '@mui/material';
import { Button, Container, Stack, Typography } from '@mui/material';
import { getSession } from '@packages/nextjs/session/getSession';
import { builderLoginUrl } from '@packages/scoutgame/constants';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { SidebarInfoDrawer } from 'components/info/components/SidebarInfoDrawer';

export const metadata: Metadata = {
  title: 'Taiko Partner Rewards'
};

function ContainerStack({ children, ...props }: { children: React.ReactNode } & StackProps) {
  return (
    <Stack
      {...props}
      sx={{
        p: {
          xs: 1,
          md: 4
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
  color
}: {
  stepNumber: string;
  title: string;
  description: string | React.ReactNode;
  iconSrc: string;
  color?: string;
}) {
  return (
    <ContainerStack>
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
          <Typography color={color || 'secondary'}>{stepNumber}</Typography>
          <Hidden mdDown>
            <Image width={85} height={85} src={iconSrc} alt={stepNumber} />
          </Hidden>
          <Hidden mdUp>
            <Image width={50} height={50} src={iconSrc} alt={stepNumber} />
          </Hidden>
        </Stack>
        <Stack width={{ xs: '80%', md: '65%' }} gap={1}>
          <Typography variant='h5' color={color || 'secondary'}>
            {title}
          </Typography>
          <Typography>{description}</Typography>
        </Stack>
      </Stack>
    </ContainerStack>
  );
}

function HeroSection({ registerUrl }: { registerUrl: string }) {
  return (
    <Stack
      sx={{
        backgroundImage: 'url(/images/home/landing-bg.png)',
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
              variant='h4'
              color='secondary'
              fontWeight={600}
              textAlign={{
                xs: 'center',
                md: 'left'
              }}
            >
              AI Agents on Taiko
            </Typography>
            <Hidden mdUp>
              <Typography variant='h6' textAlign='center'>
                Build an AI Agent on Taiko. <br /> Rack up rewards in Scout Game as your Agent rocks onchain!
              </Typography>
            </Hidden>
            <Hidden mdDown>
              <Typography variant='h6' textAlign='left'>
                Build an AI Agent on Taiko. <br /> Rack up rewards in Scout Game as your Agent rocks onchain!
              </Typography>
            </Hidden>
            <Button
              variant='contained'
              sx={{
                my: 2,
                width: 'fit-content',
                mx: {
                  xs: 'auto',
                  md: 0
                },
                py: 1,
                fontSize: '1.15rem'
              }}
              size='large'
              data-test='get-started-button'
            >
              <Link href={registerUrl}>Register</Link>
            </Button>
          </Stack>
          <Hidden mdDown>
            <Image src='/images/partner/taiko-hero.png' width={300} height={300} alt='Cool dev' />
          </Hidden>
          <Hidden mdUp>
            <Image src='/images/partner/taiko-hero.png' width={250} height={250} alt='Cool dev' />
          </Hidden>
        </Stack>
      </Container>
    </Stack>
  );
}

export function HowToPlaySection() {
  return (
    <Stack alignItems='center' my={3}>
      <Typography variant='h4' color='secondary' fontWeight={500}>
        How to Play
      </Typography>
      <Stack gap={2.5}>
        <Step
          stepNumber='Step 1'
          title='Build an AI Agent on Taiko'
          description='Using ElizaOS and Taiko’s plugin, deploy an AI Agent on Taiko.'
          iconSrc='/images/home/robot-icon.svg'
        />
        <Step
          stepNumber='Step 2'
          title='Register your Agent in Scout Game'
          description="Create a Scout Game account, connect your GitHub. Create a project in Scout Game. Once we verify your Agent’s onchain activity, you're in the game!"
          iconSrc='/images/home/scoutgame-icon.svg'
        />
        <Step
          stepNumber='Step 3'
          title='Put your AI Agent to Work'
          description='Scout Game will monitor your Agent’s onchain activity: # of transactions, gas used, # of daily active wallets.'
          iconSrc='/images/home/gaspump-icon.svg'
        />
        <Step
          color='#E81899'
          stepNumber='Step 4'
          title='Earn Taiko'
          description='Taiko will reward successful AI Agent projects each week based on their onchain activity tier: Common, Rare, or Epic! Mo’ activity, mo’ Taiko!'
          iconSrc='/images/home/taiko-icon.svg'
        />
      </Stack>
    </Stack>
  );
}

function FooterSection({ registerUrl }: { registerUrl: string }) {
  return (
    <Stack
      position='relative'
      alignItems='center'
      gap={2}
      py={{ xs: 2, md: 4 }}
      sx={{
        backgroundImage: 'url(/images/home/landing-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Stack mx='auto' justifyContent='center' alignItems='center' gap={2}>
        <Typography variant='h6' textAlign='center'>
          Register your Taiko AI Agent in Scout Game. <br /> Earn rewards for your onchain activity!
        </Typography>
        <Button variant='contained' sx={{ width: 'fit-content', py: 1, fontSize: '1.15rem' }}>
          <Link href={registerUrl}>Register</Link>
        </Button>
      </Stack>
    </Stack>
  );
}

export default async function Taiko() {
  const session = await getSession();
  const user = session.scoutId
    ? await prisma.scout.findFirst({
        where: {
          id: session.scoutId
        },
        select: {
          githubUsers: true,
          scoutProjectMembers: {
            select: {
              userId: true
            }
          }
        }
      })
    : null;

  const registerUrl = !user
    ? `${builderLoginUrl}&utm_source=partner&utm_campaign=taiko`
    : user.githubUsers.length === 0
      ? '/welcome?type=builder&step=2'
      : user.scoutProjectMembers.length === 0
        ? '/profile/projects/create'
        : '/welcome?type=builder&step=3';

  return (
    <Stack maxWidth='854px' width='100%' mx='auto' gap={{ xs: 2, md: 4 }}>
      <Stack
        flexDirection='row'
        alignItems='center'
        justifyContent={{ xs: 'space-between', md: 'center' }}
        data-test='info-page'
      >
        <Typography variant='h4' textAlign='center' color='secondary'>
          Taiko Partner Rewards
        </Typography>
        <SidebarInfoDrawer />
      </Stack>
      <Stack
        height='100%'
        overflow='hidden'
        sx={{
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <Stack height='100%' overflow='auto'>
          <HeroSection registerUrl={registerUrl} />
          <HowToPlaySection />
          <FooterSection registerUrl={registerUrl} />
        </Stack>
      </Stack>
    </Stack>
  );
}
