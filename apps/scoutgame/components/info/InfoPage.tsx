import type { StackProps } from '@mui/material';
import { Container, Stack, Typography } from '@mui/material';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import Image from 'next/image';

import { InfoPageContainer } from './components/InfoPageContainer';

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
    <ContainerStack sx={{ flexDirection: additionalContent ? 'column' : 'row' }}>
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

export function InfoPageContent({ hideDeveloperCard = false }: { hideDeveloperCard?: boolean }) {
  return (
    <Container
      maxWidth='lg'
      sx={{
        px: '0px !important'
      }}
    >
      <Step
        stepNumber='Step 1'
        title='Discover Developers and Projects'
        description='Jump into the Scout Game and find out who is building cool, open-source stuff. Get to know the movers and shakers of the onchain world and win with them.'
        iconSrc='/images/home/scout-icon.svg'
      />
      <Step
        stepNumber='Step 2'
        title='Collect Developer Cards'
        description='Spot talented developers and snag their exclusive NFT Developers Cards. Your picks help highlight the best talent out there!'
        iconSrc='/images/home/card-icon.svg'
        additionalContent={
          hideDeveloperCard ? null : (
            <Stack alignItems='center'>
              <Typography variant='h6' color='secondary' mt={2} mb={1} textAlign='center'>
                carl's Developer Card
              </Typography>
              <Hidden mdDown>
                <Image
                  src='/images/home/card-diagram.png'
                  width='350'
                  height='350'
                  alt='Collect cards'
                  style={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'contain'
                  }}
                />
              </Hidden>
              <Hidden mdUp>
                <Stack alignItems='center'>
                  <Image
                    src='/images/home/card-diagram-mobile.png'
                    width='350'
                    height='350'
                    alt='Collect cards'
                    style={{
                      height: '100%',
                      width: '85%',
                      objectFit: 'cover'
                    }}
                  />
                </Stack>
              </Hidden>
            </Stack>
          )
        }
      />
      <Step
        stepNumber='Step 3'
        title='Compete & Win'
        description='Compete against other Scouts in weekly challenges. Scout talent, earn rewards, and prove you’re the best in the game!'
        iconSrc='/images/home/trophy-icon.svg'
      />
      <Step
        stepNumber='Step 4'
        title='Earn Rewards'
        description='Collect DEV Tokens from the Developers you’ve scouted and score bonus prizes like cUSD or OP from our awesome partners. Supporting innovation has never been this exciting or this rewarding!'
        iconSrc='/images/home/quests-icon.svg'
      />
    </Container>
  );
}

export function InfoPage() {
  return (
    <InfoPageContainer data-test='info-page' image='/images/info/info_banner.png' title='How to Play'>
      <InfoPageContent />
    </InfoPageContainer>
  );
}
