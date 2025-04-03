import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { ClaimTokenScreen } from '@/components/claim/ClaimTokenScreen';

export default function AirdropPage() {
  return (
    <Container
      maxWidth='lg'
      sx={{
        py: {
          xs: 2,
          md: 4
        }
      }}
    >
      <Stack
        sx={{
          height: {
            xs: 'fit-content',
            md: 400
          }
        }}
      >
        <ClaimTokenScreen />
      </Stack>
      <Stack
        flexDirection={{
          xs: 'column',
          md: 'row'
        }}
        gap={{
          xs: 1,
          md: 2
        }}
      >
        <Paper
          sx={{
            py: {
              xs: 1,
              md: 2
            },
            px: {
              xs: 1,
              md: 3
            },
            flex: 1,
            gap: {
              xs: 1,
              md: 1.5
            },
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Stack flexDirection='row' gap={1} alignItems='center'>
            <Image src='/images/diamond-icon.svg' alt='Diamond Icon' width={25} height={25} />
            <Typography variant='h5' color='secondary'>
              Diamond Hands Rewards
            </Typography>
          </Stack>
          <Typography>
            Don’t sell your airdrop! Earn Diamond Hands Rewards by using your DEV tokens in any combination of 3 ways:
          </Typography>
          <Stack gap={1}>
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <Image src='/images/one-icon-white.svg' alt='One Icon' width={18} height={18} />
              <Typography>Play Scout Game</Typography>
            </Stack>
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <Image src='/images/two-icon-white.svg' alt='Two Icon' width={18} height={18} />
              <Typography>Support Open Source</Typography>
            </Stack>
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <Image src='/images/three-icon-white.svg' alt='Three Icon' width={18} height={18} />
              <Typography>Hold!</Typography>
            </Stack>
          </Stack>
          <Typography>Stack up bonuses in future airdrops!</Typography>
          <Stack flexDirection='row' gap={4} alignItems='center' justifyContent='center'>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Image src='/images/diamond.png' alt='Diamond Icon' width={125} height={125} />
            </Box>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Image src='/images/diamond.png' alt='Diamond Icon' width={90} height={90} />
            </Box>
            <Stack flexDirection='column' gap={1}>
              <Typography>
                Season 2:{' '}
                <Typography component='span' color='green'>
                  +15% Bonus
                </Typography>
              </Typography>
              <Typography>
                Season 3:{' '}
                <Typography component='span' color='green'>
                  +20% Bonus
                </Typography>
              </Typography>
              <Typography>
                Season 4:{' '}
                <Typography component='span' color='green'>
                  +25% Bonus
                </Typography>
              </Typography>
              <Typography>
                Season 5:{' '}
                <Typography component='span' color='green'>
                  +40% Bonus
                </Typography>
              </Typography>
            </Stack>
          </Stack>
          <Stack gap={1} mt={2}>
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <ReportProblemOutlinedIcon color='error' />
              <Typography color='error' variant='h6'>
                Sell your airdrop?
              </Typography>
            </Stack>
            <Typography>
              Selling any portion of your airdrop will disqualify you from Diamond Hands Rewards. You will receive a
              soulbound Paper Hands token that will affect your future airdrops.
            </Typography>
          </Stack>
        </Paper>
        <Stack
          flex={1.5}
          gap={{
            xs: 1,
            md: 2
          }}
        >
          <Paper
            sx={{
              p: {
                xs: 1,
                md: 2
              },
              flex: 1
            }}
          >
            <Stack flexDirection='row' gap={1} alignItems='center' mb={1}>
              <Image src='/images/one-icon.svg' alt='Step 1' width={25} height={25} />
              <Typography variant='h6' color='secondary'>
                Play Scout Game
              </Typography>
            </Stack>
            <Typography>
              <Typography component='span' color='green'>
                Use your DEV tokens to buy Developer Cards to play in the weekly competition.
              </Typography>{' '}
              Identify the best talent early for the biggest rewards. <br />
              <br />
              Draft your team before Season 1 begins on April 28, 2025. Winning bids receive the Developer Cards, losing
              bids are refunded.
            </Typography>
          </Paper>
          <Paper
            sx={{
              p: {
                xs: 1,
                md: 2
              },
              flex: 1
            }}
          >
            <Stack flexDirection='row' gap={1} alignItems='center' mb={1}>
              <Image src='/images/two-icon.svg' alt='Step 2' width={25} height={25} />
              <Typography variant='h6' color='secondary'>
                Support Open Source
              </Typography>
            </Stack>
            <Typography>
              <Typography component='span' color='green'>
                Donate your DEV tokens to the Scout Game Open Source Grants Program.
              </Typography>{' '}
              The Grants will be distributed to open source developers playing Scout Game. <br /> <br />
              Donate 100% of your airdrop to open source and instantly earn Season 2's bonus while funding critical
              projects.
            </Typography>
          </Paper>
          <Paper
            sx={{
              p: {
                xs: 1,
                md: 2
              },
              flex: 1
            }}
          >
            <Stack flexDirection='row' gap={1} alignItems='center' mb={1}>
              <Image src='/images/three-icon.svg' alt='Diamond Icon' width={25} height={25} />
              <Typography variant='h6' color='secondary'>
                Hold
              </Typography>
            </Stack>
            <Typography>
              <Typography component='span' color='green'>
                Holding pays off.
              </Typography>{' '}
              Keep 100% of your airdrop and you'll stack bonus rewards in future seasons.
            </Typography>
          </Paper>
        </Stack>
      </Stack>
    </Container>
  );
}
