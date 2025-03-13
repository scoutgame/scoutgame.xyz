import TelegramIcon from '@mui/icons-material/Telegram';
import XIcon from '@mui/icons-material/X';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { Stack, Link as MuiLink, SvgIcon, Typography, Container } from '@mui/material';
import Image from 'next/image';

import { partners } from '../partnerConfig';

export function InfoPageFooter() {
  return (
    <Stack
      sx={{
        backgroundColor: '#101010'
      }}
    >
      <Container
        maxWidth='lg'
        sx={{
          p: {
            xs: 2.5,
            md: 4
          },
          width: '100%',
          justifyContent: 'space-between',
          flexDirection: {
            xs: 'column',
            md: 'row'
          },
          gap: {
            xs: 4,
            md: 0
          },
          display: 'flex'
        }}
      >
        <Stack flex={1} alignItems='flex-start'>
          <Stack gap={1} alignItems='center'>
            <Image src='/images/scout-game-logo.png' alt='Scout Game Logo' width={1044 / 6} height={464 / 6} />
            <Stack flexDirection='row' gap={2} alignItems='center'>
              <MuiLink href='https://x.com/scoutgamexyz' target='_blank'>
                <XIcon sx={{ color: 'text.primary', width: 20, height: 20 }} />
              </MuiLink>
              <MuiLink href='https://t.me/scoutgameportal' target='_blank'>
                <TelegramIcon sx={{ color: 'text.primary' }} />
              </MuiLink>
              <MuiLink href='https://warpcast.com/scoutgamexyz' target='_blank'>
                <SvgIcon sx={{ width: 22, height: 22, color: 'text.primary' }}>
                  <svg
                    width='19'
                    height='14'
                    viewBox='0 0 19 14'
                    fill='currentColor'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path d='M14.5187 0.738892L12.9414 6.66285L11.3589 0.738892H7.71707L6.11941 6.70649L4.52698 0.738892H0.379089L4.23341 13.8367H7.8119L9.52304 7.75459L11.2341 13.8367H14.8203L18.6662 0.738892H14.5187Z' />
                  </svg>
                </SvgIcon>
              </MuiLink>
              <MuiLink href='https://www.youtube.com/@scoutgamexyz' target='_blank'>
                <YouTubeIcon sx={{ color: 'text.primary' }} />
              </MuiLink>
            </Stack>
          </Stack>
        </Stack>
        <Stack gap={1} flex={1}>
          <Typography
            variant='body1'
            fontWeight={600}
            mb={{
              xs: 0,
              md: 1
            }}
          >
            Resources
          </Typography>
          <MuiLink href='/info'>
            <Typography>About Scout Game</Typography>
          </MuiLink>
          <MuiLink href='/info/partner-rewards'>
            <Typography>Partner Rewards</Typography>
          </MuiLink>
          <MuiLink href='/info/contribution-guide'>
            <Typography>Open-Source Contribution Guide</Typography>
          </MuiLink>
          <MuiLink href='/info/core-maintainer-guide'>
            <Typography>Core Maintainer Guide</Typography>
          </MuiLink>
          <MuiLink href='/info/privacy-policy'>
            <Typography>Privacy Policy</Typography>
          </MuiLink>
          <MuiLink href='/info/terms'>
            <Typography>Terms</Typography>
          </MuiLink>
          <MuiLink href='/info/dpa'>
            <Typography>DPA</Typography>
          </MuiLink>
        </Stack>

        <Stack gap={1} flex={1}>
          <Typography
            variant='body1'
            fontWeight={600}
            mb={{
              xs: 0,
              md: 1
            }}
          >
            Partners
          </Typography>
          {partners.map((partner) => (
            <MuiLink key={partner.href} href={partner.href}>
              <Typography>{partner.text}</Typography>
            </MuiLink>
          ))}
        </Stack>
      </Container>
    </Stack>
  );
}
