import { IconButton, Stack } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Image from 'next/image';

type ShareMessageProps = {
  totalUnclaimedTokens: number;
  isBuilder: boolean;
  platform: 'x' | 'telegram' | 'warpcast';
  userPath: string;
  developers: { farcasterHandle?: string; displayName: string }[];
  week: string;
};

export function TokensClaimSocialShare(props: Omit<ShareMessageProps, 'platform'>) {
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
  totalUnclaimedTokens,
  referralCode,
  isBuilder,
  platform,
  userPath,
  developers,
  week
}: ShareMessageProps & { referralCode?: string }) {
  const imageUrl = `${window.location.origin}/points-claim/${userPath}?week=${week}`;
  let shareMessage = isBuilder
    ? `I earned ${totalUnclaimedTokens} DEV Tokens this week as a Top Developer!`
    : `I earned ${totalUnclaimedTokens} DEV Tokens this week as a Top Scout!`;
  // Twitter discounts tweets with links
  if (platform === 'x') {
    shareMessage += `\n\nI'm playing @scoutgamexyz.\n\n`;
  } else if (isBuilder) {
    shareMessage += ` Discover my work and scout me to see what I'm building next!\nMy profile: https://scoutgame.xyz/u/${userPath}\n\n`;
  } else {
    const developersFormatted =
      platform === 'warpcast'
        ? developers
            .map((developer) => (developer.farcasterHandle ? `@${developer.farcasterHandle}` : developer.displayName))
            .join(', ')
        : developers.map((developer) => developer.displayName).join(', ');
    shareMessage += ` Big shoutout to my top Developers: ${developersFormatted}. Who will be next?\nMy profile: https://scoutgame.xyz/u/${userPath}\n\n`;
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
