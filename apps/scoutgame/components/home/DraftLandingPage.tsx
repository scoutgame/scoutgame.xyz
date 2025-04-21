import { Button, Container, Paper, Stack, Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import Image from 'next/image';
import Link from 'next/link';

import { InfoPageFooter } from 'components/info/components/InfoPageFooter';

import { LoginButton } from './LoginButton';

function HeroSection() {
  return (
    <Stack sx={{ position: 'relative' }}>
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
          my={{
            xs: 2,
            md: 4
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
              fontWeight={500}
              textAlign={{
                xs: 'center',
                md: 'left'
              }}
              mb={{
                xs: 1,
                md: 2
              }}
            >
              Welcome to the Draft!
            </Typography>
            <Hidden mdDown>
              <Typography variant='h6'>
                Scout Game is a deck-building game that runs in 13 <br />
                week seasons. Each season is preceded by a 1 week draft.
              </Typography>
            </Hidden>
            <Hidden mdUp>
              <Typography variant='h6' px={2}>
                Scout Game is a deck-building game that runs in 13 week seasons. Each season is preceded by a 1 week
                draft.
              </Typography>
            </Hidden>
            <Hidden mdDown>
              <Typography variant='h6'>
                Get started by drafting Developers before the <br />
                season officially begins!
              </Typography>
            </Hidden>
            <Hidden mdUp>
              <Typography variant='h6' px={2}>
                Get started by drafting Developers before the <br />
                season officially begins!
              </Typography>
            </Hidden>
            <LoginButton />
          </Stack>
          <Hidden mdDown>
            <Image src='/images/home/draft-open.png' width={350} height={350} alt='Draft Open' />
          </Hidden>
        </Stack>
      </Container>
    </Stack>
  );
}

function HowToPlaySection() {
  return (
    <Container maxWidth='lg'>
      <Stack
        zIndex={{
          xs: 0,
          md: 1
        }}
        alignItems='center'
        mb={6}
        gap={3}
      >
        <Stack flexDirection={{ xs: 'column', md: 'row' }} gap={3} width='100%'>
          <Paper sx={{ flex: 1, borderRadius: 2, p: { xs: 2, md: 4 }, pb: 2 }}>
            <Stack flexDirection='row' gap={4} mb={3}>
              <Image height={100} width={100} src='/images/home/one.svg' alt='One' />
              <Stack>
                <Typography variant='h4' color='secondary'>
                  week
                </Typography>
                <Typography variant='h3' fontWeight={800} color='secondary'>
                  Draft
                </Typography>
              </Stack>
            </Stack>
            <Stack>
              <Typography variant='h4' color='secondary'>
                Why draft?
              </Typography>
              <List sx={{ listStyleType: 'disc', pl: 2 }}>
                <ListItem sx={{ display: 'list-item', pl: 1 }}>
                  <ListItemText>
                    The draft gives serious players the opportunity to bid on their favorite developers before the
                    season begins.
                  </ListItemText>
                </ListItem>
                <ListItem sx={{ display: 'list-item', pl: 1 }}>
                  <ListItemText>
                    A fair launch of the season’s Developer Cards prevents sniping by speculators in the first few hours
                    of the season.
                  </ListItemText>
                </ListItem>
              </List>
            </Stack>
          </Paper>
          <Paper sx={{ flex: 1, borderRadius: 2, p: { xs: 2, md: 4 }, pb: 2 }}>
            <Stack flexDirection='row' gap={4} mb={3}>
              <Image height={100} width={100} src='/images/home/thirteen.svg' alt='Thirteen' />
              <Stack>
                <Typography variant='h4' color='secondary'>
                  week
                </Typography>
                <Typography variant='h3' fontWeight={800} color='secondary'>
                  Season
                </Typography>
              </Stack>
            </Stack>
            <Stack>
              <Typography variant='h4' color='secondary'>
                How does Scout Game work?
              </Typography>
              <List sx={{ listStyleType: 'disc', pl: 2 }}>
                <ListItem sx={{ display: 'list-item', pl: 1 }}>
                  <ListItemText>
                    Holding a Developer’s Card earns you rewards when your Developer scores in the weekly Gem
                    competition.
                  </ListItemText>
                </ListItem>
                <ListItem sx={{ display: 'list-item', pl: 1 }}>
                  <ListItemText>
                    Developers earn Gems by contributing code to popular onchain projects or generating onchain
                    transactions using specific frameworks on designated chains.
                  </ListItemText>
                </ListItem>
              </List>
            </Stack>
          </Paper>
        </Stack>
        <Stack flexDirection={{ xs: 'column', md: 'row' }} gap={3} width='100%'>
          <Paper sx={{ flex: 1, borderRadius: 2, p: { xs: 2, md: 4 } }}>
            <Stack flexDirection='row' gap={4}>
              <Image height={100} width={100} src='/images/home/scout-sticker.png' alt='Scout Sticker' />
              <Stack>
                <Typography variant='h4' color='secondary'>
                  draft
                </Typography>
                <Typography variant='h3' fontWeight={800} color='secondary'>
                  Rules
                </Typography>
              </Stack>
            </Stack>
            <Stack gap={1}>
              <Stack>
                <Typography variant='h6' fontWeight={600} color='secondary'>
                  Bidding
                </Typography>
                <Typography>
                  Only the top 50 bids for each developer win a Developer Card. Minimum bid is 100 DEV tokens.
                </Typography>
              </Stack>

              <Stack>
                <Typography variant='h6' fontWeight={600} color='secondary'>
                  Timeline
                </Typography>
                <Typography>Draft opens April 21st and runs through April 27th, UTC.</Typography>
              </Stack>

              <Stack>
                <Typography variant='h6' fontWeight={600} color='secondary'>
                  After the Draft
                </Typography>
                <Typography>On the opening day of Season 1, April 28th:</Typography>
                <List sx={{ listStyleType: 'disc', pl: 2 }}>
                  <ListItem sx={{ display: 'list-item', pl: 1, py: 0 }}>
                    <ListItemText>Winning bids receive Developer Cards.</ListItemText>
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', pl: 1, py: 0 }}>
                    <ListItemText>Losing bids are refunded.</ListItemText>
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', pl: 1, py: 0 }}>
                    <ListItemText>Unsold cards go to marketplace.</ListItemText>
                  </ListItem>
                </List>
              </Stack>
            </Stack>
          </Paper>
          <Paper sx={{ flex: 1, borderRadius: 2, p: { xs: 2, md: 4 } }}>
            <Stack flexDirection='row' gap={4}>
              <Image height={100} width={100} src='/images/home/cards.png' alt='Cards' />
              <Stack>
                <Typography variant='h4' color='secondary'>
                  developer
                </Typography>
                <Typography variant='h3' fontWeight={800} color='secondary'>
                  Cards
                </Typography>
              </Stack>
            </Stack>
            <List sx={{ listStyleType: 'disc', pl: 2 }}>
              <ListItem sx={{ display: 'list-item', pl: 1 }}>
                <ListItemText>
                  50 Cards are available for each Developer. When the season opens, the price of a Developer’s Card
                  increases by 100 DEV tokens each time a card is sold.
                </ListItemText>
              </ListItem>
              <ListItem sx={{ display: 'list-item', pl: 1, py: 0.5 }}>
                <ListItemText>
                  Standard Developer Cards are may be listed and sold in game during the season.
                </ListItemText>
              </ListItem>
              <ListItem sx={{ display: 'list-item', pl: 1, py: 0.5 }}>
                <ListItemText>
                  Having at least 5 Developers in your deck sets you up to play in additional game modes like the Weekly
                  Match Up.
                </ListItemText>
              </ListItem>
            </List>
          </Paper>
        </Stack>
      </Stack>
    </Container>
  );
}

function FooterSection() {
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
        <Button variant='blue' sx={{ width: '50%' }}>
          <Link href='/login'>Play</Link>
        </Button>
      </Stack>
    </Stack>
  );
}

export function DraftLandingPage() {
  return (
    <Stack height='100%'>
      <HeaderMessage />
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
