import type { MinimalUserInfo } from '@packages/users/interfaces';

export function FarcasterMetadata({
  user
}: {
  user: (MinimalUserInfo & { nftImageUrl?: string; congratsImageUrl?: string | null }) | null;
}) {
  if (!user?.avatar) {
    return null;
  }

  // The Mini App URL format: https://farcaster.xyz/miniapps/<app-id>/scoutgame/u/<user-path>
  const miniAppUrl = `https://farcaster.xyz/miniapps/JX-BIkAO-oMv/scout-game/u/${user.path}`;

  return (
    <>
      {/* Custom meta tags for farcaster */}
      <meta name='fc:frame' content='vNext' />
      <meta name='fc:frame:image' content={user.congratsImageUrl || user.nftImageUrl || user.avatar} />
      <meta property='fc:frame:image:aspect_ratio' content='1:1' />
      {/* Button 1 */}
      <meta name='fc:frame:button:1' content='Scout Developer' />
      <meta name='fc:frame:button:1:action' content='link' />
      <meta name='fc:frame:button:1:target' content={miniAppUrl} />
    </>
  );
}
