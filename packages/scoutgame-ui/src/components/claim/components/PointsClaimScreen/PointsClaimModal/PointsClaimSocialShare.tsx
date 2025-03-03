import { IconButton, Stack } from '@mui/material';
import Image from 'next/image';

import { useMdScreen } from '../../../../../hooks/useMediaScreens';
import { useUser } from '../../../../../providers/UserProvider';

type ShareMessageProps = {
  totalUnclaimedPoints: number;
  isBuilder: boolean;
  platform: 'x' | 'telegram' | 'warpcast';
  userPath: string;
  builders: { farcasterHandle?: string; displayName: string }[];
  week: string;
};

export function PointsClaimSocialShare(props: Omit<ShareMessageProps, 'platform'>) {
  const isMd = useMdScreen();
  const { user } = useUser();

  const handleShare = (platform: 'x' | 'telegram' | 'warpcast') => {
    const shareUrl = getShareMessage({ ...props, platform, referralCode: user?.referralCode });
    window.open(shareUrl, '_blank');
  };

  const size = !isMd ? 30 : 42.5;

  return (
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
  );
}

function getShareMessage({
  totalUnclaimedPoints,
  referralCode,
  isBuilder,
  platform,
  userPath,
  builders,
  week
}: ShareMessageProps & { referralCode?: string }) {
  const imageUrl = `${window.location.origin}/points-claim/${userPath}?week=${week}`;
  let shareMessage = isBuilder
    ? `I scored ${totalUnclaimedPoints} Scout Points this week as a Top Developer!`
    : `I scored ${totalUnclaimedPoints} Scout Points this week as a Top Scout!`;
  // Twitter discounts tweets with links
  if (platform === 'x') {
    shareMessage += `\n\nI'm playing @scoutgamexyz.\n\n`;
  } else if (isBuilder) {
    shareMessage += ` Discover my work and scout me to see what I'm building next!\nMy profile: https://scoutgame.xyz/u/${userPath}\n\n`;
  } else {
    const buildersFormatted =
      platform === 'warpcast'
        ? builders
            .map((builder) => (builder.farcasterHandle ? `@${builder.farcasterHandle}` : builder.displayName))
            .join(', ')
        : builders.map((builder) => builder.displayName).join(', ');
    shareMessage += ` Big shoutout to my top Developers: ${buildersFormatted}. Who will be next?\nMy profile: https://scoutgame.xyz/u/${userPath}\n\n`;
  }
  const urls = {
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(`${shareMessage}\nJoin me! ${referralCode ? `https://scoutgame.xyz/login?ref=${referralCode}` : ''}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(shareMessage)}`,
    warpcast: `https://warpcast.com/~/compose?text=${encodeURIComponent(shareMessage)}&embeds[]=${encodeURIComponent(
      imageUrl
    )}`
  };
  return urls[platform];
}
