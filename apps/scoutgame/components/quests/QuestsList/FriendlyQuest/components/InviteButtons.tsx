'use client';

import { Box, Button, IconButton, Link, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { telegramBotName } from '@packages/scoutgame/constants';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import type { Friend } from '@packages/users/getFriends';
import { getPlatform } from '@packages/utils/platform';
import WebApp from '@twa-dev/sdk';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { LuCopy } from 'react-icons/lu';

import { MyFriends } from './MyFriends';
import { MyFriendsDialog } from './MyFriendsDialog';

export function InviteButtons({ stats, friends }: { stats?: ReactNode; friends: Friend[] }) {
  const { user } = useUser();
  const isTelegram = getPlatform() === 'telegram';
  const [copied, setCopied] = useState('');
  const trackEvent = useTrackEvent();
  const referral = user?.referralCode;
  const url = `https://scoutgame.xyz/login?ref=${referral}`;
  const telegramUrl = `https://t.me/${telegramBotName}/start?startapp=ref_${referral}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTelegramUrl = encodeURIComponent(telegramUrl);
  const encodedText = encodeURIComponent(
    "Join me in Scout Game. Collect developer cards to earn DEV Tokens, OP, Moxie and more! Use my link to sign up and we'll both earn 5 DEV Tokens to play.🫡"
  );
  const shareImageSize = 35;

  const telegramShareUrl = `https://t.me/share/url?url=${encodedTelegramUrl}&text=${encodedText}`;

  const onCopy = async () => {
    if (typeof window !== 'undefined') {
      if (isTelegram) {
        WebApp.requestWriteAccess(async (access) => {
          if (access) {
            try {
              await navigator.clipboard.writeText(telegramUrl);
            } catch (_) {
              // permissions error
            }
            setCopied('Copied!');
            trackEvent('copy_referral_link');
          } else {
            setCopied('You need to give access to copy the link');
          }
        });
      } else {
        try {
          await navigator.clipboard.writeText(url);
          setCopied('Copied!');
          trackEvent('copy_referral_link');
        } catch (_) {
          setCopied('You need to give access to copy the link');
        }
      }
    }
  };

  if (!referral) {
    return null;
  }

  return (
    <Stack gap={2}>
      <Typography variant='h5' textAlign='center' color='secondary'>
        Share your link!
      </Typography>
      <Stack justifyContent='center' alignItems='center' gap={1} flexDirection='row'>
        {isTelegram ? (
          <Button
            href={telegramShareUrl}
            fullWidth
            variant='outlined'
            sx={{ border: `1px solid`, borderColor: 'secondary.main', color: 'secondary.main' }}
            onClick={() => trackEvent('click_telegram_refer_friend_button')}
          >
            Invite Friends
          </Button>
        ) : (
          <Paper sx={{ borderRadius: '10px', border: `1px solid`, width: '100%', borderColor: 'secondary.main', p: 1 }}>
            <Typography sx={{ width: '100%' }} variant='body2'>
              https://scoutgame.xyz/login?ref={referral}
            </Typography>
          </Paper>
        )}
        <Tooltip arrow placement='top' title={copied || undefined} disableInteractive>
          <IconButton
            sx={{
              border: `1px solid`,
              borderColor: 'secondary.main',
              color: 'secondary.main',
              borderRadius: '10px'
            }}
            onClick={onCopy}
            data-test='copy-referral-link'
          >
            <LuCopy />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack flexDirection={{ xs: 'row', md: 'column' }} justifyContent='space-between' alignItems='center' gap={2}>
        <Box>
          <Typography variant='h5' color='secondary'>
            More ways to share
          </Typography>
          <Stack flexDirection='row' gap={{ xs: 0, md: 4 }}>
            <IconButton
              href={telegramShareUrl}
              LinkComponent={Link}
              target='_blank'
              sx={{
                bgcolor: 'black.main',
                borderRadius: '10px'
              }}
            >
              <img src='/images/logos/telegram.png' alt='telegram' width={shareImageSize} height={shareImageSize} />
            </IconButton>
            <IconButton
              href={`https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
              LinkComponent={Link}
              target='_blank'
              sx={{
                bgcolor: 'black.main',
                borderRadius: '10px'
              }}
            >
              <img src='/images/logos/x.png' alt='x' width={shareImageSize} height={shareImageSize} />
            </IconButton>
            <IconButton
              href={`https://farcaster.xyz/~/compose?text=${encodedText}&embeds[]=${encodedUrl}`}
              LinkComponent={Link}
              target='_blank'
              sx={{
                bgcolor: 'black.main',
                borderRadius: '10px'
              }}
            >
              <img src='/images/logos/farcaster.png' alt='farcaster' width={shareImageSize} height={shareImageSize} />
            </IconButton>
          </Stack>
          <Hidden mdUp>
            <MyFriendsDialog>
              <MyFriends friends={friends} />
            </MyFriendsDialog>
          </Hidden>
        </Box>
        <Stack>{stats}</Stack>
      </Stack>
    </Stack>
  );
}
