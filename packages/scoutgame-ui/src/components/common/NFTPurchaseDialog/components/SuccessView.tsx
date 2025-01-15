'use client';

import { IconButton, Stack, Typography } from '@mui/material';
import { completeQuestAction } from '@packages/scoutgame/quests/completeQuestAction';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';

import { useMdScreen } from '../../../../hooks/useMediaScreens';
import { useUser } from '../../../../providers/UserProvider';

export function SuccessView({
  builder
}: {
  builder: { id: string; displayName: string; congratsImageUrl?: string | null; path: string };
}) {
  const isMd = useMdScreen();

  const { refreshUser, user } = useUser();

  const { execute, isExecuting } = useAction(completeQuestAction, {
    onSuccess: () => {
      refreshUser();
    }
  });

  const handleShare = (platform: 'x' | 'telegram' | 'warpcast') => {
    const shareUrl = getShareMessage({
      builderName: builder.displayName,
      builderPath: builder.path,
      platform,
      referralCode: user ? user.referralCode : undefined
    });
    window.open(shareUrl, '_blank');
    if (!isExecuting) {
      execute({ questType: 'scout-share-builder' });
    }
  };
  const size = !isMd ? 30 : 42.5;

  return (
    <Stack gap={2} textAlign='center' data-test='success-view'>
      <Typography color='secondary' variant='h5' fontWeight={600}>
        Congratulations!
      </Typography>
      <Typography>You scouted {builder.displayName}</Typography>
      {builder.congratsImageUrl ? (
        <Image
          src={builder.congratsImageUrl}
          alt={`${builder.displayName} nft`}
          width={400}
          height={400}
          sizes='100vw'
          style={{
            width: '100%',
            height: 'auto'
          }}
        />
      ) : (
        <Image
          src='/images/no_nft_person.png'
          alt='no nft image available'
          width={200}
          height={200}
          style={{ margin: '0 auto' }}
        />
      )}
      <Stack
        sx={{
          justifyContent: 'center',
          p: {
            xs: 1,
            md: 2
          },
          alignItems: 'center',
          backgroundColor: '#D8E1FF'
        }}
      >
        <Typography variant={isMd ? 'h6' : 'subtitle1'} color='#000' fontWeight='bold'>
          Share now
        </Typography>
        <Stack flexDirection='row' justifyContent='center'>
          <IconButton onClick={() => handleShare('x')}>
            <Image src='/images/logos/x.png' alt='X' width={size} height={size} />
          </IconButton>
          <IconButton onClick={() => handleShare('telegram')}>
            <Image src='/images/logos/telegram.png' alt='Telegram' width={size} height={size} />
          </IconButton>
          <IconButton onClick={() => handleShare('warpcast')}>
            <Image src='/images/logos/warpcast.png' alt='Warpcast' width={size} height={size} />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
}

function getShareMessage({
  builderName,
  builderPath,
  platform,
  referralCode
}: {
  builderName: string;
  builderPath: string;
  platform: 'x' | 'telegram' | 'warpcast';
  referralCode?: string;
}) {
  const embedUrl = `${window.location.origin}/u/${builderPath}`;
  const shareMessage = `I scouted ${builderName} on Scout Game!`;

  const urls = {
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(`${shareMessage}\nI'm playing @scoutgamexyz. Join me! ${referralCode ? `https://scoutgame.xyz/login?ref=${referralCode}` : ''}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(embedUrl)}&text=${encodeURIComponent(shareMessage)}`,
    warpcast: `https://warpcast.com/~/compose?text=${encodeURIComponent(shareMessage)}&embeds[]=${encodeURIComponent(
      embedUrl
    )}`
  };
  return urls[platform];
}
