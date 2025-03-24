// Must be there otherwise React is not defined error is thrown
import sharp from 'sharp';

import type { BuilderActivity } from '../../builders/getBuilderActivities';
import type { BuilderScouts } from '../../builders/getBuilderScouts';
import type { BuilderStats } from '../../builders/getBuilderStats';

import { BuilderShareImage } from './components/BuilderShareImage';

const blacklistedEmojis = ['⌐◨', '-◨', '◨-', '₊'];

export async function generateShareImage({
  userImage,
  activities,
  builderPrice,
  stats,
  builderScouts
}: {
  userImage: string;
  activities: BuilderActivity[];
  stats: BuilderStats;
  builderScouts: BuilderScouts;
  builderPrice: bigint;
}): Promise<Buffer> {
  builderScouts.scouts.forEach((scout) => {
    for (const emoji of blacklistedEmojis) {
      if (scout.displayName.includes(emoji)) {
        scout.displayName = scout.displayName.replaceAll(emoji, '');
      }
    }
  });

  activities.forEach((activity) => {
    for (const emoji of blacklistedEmojis) {
      if (activity.displayName.includes(emoji)) {
        activity.displayName = activity.displayName.replaceAll(emoji, '');
      }

      if (activity.type === 'nft_purchase') {
        activity.scout.displayName = activity.scout.displayName.replaceAll(emoji, '');
      }
    }
  });

  const response = await fetch(userImage);
  const arrayBuffer = await response.arrayBuffer();
  const avatarBuffer = await sharp(Buffer.from(arrayBuffer)).resize(150, 200).png().toBuffer();
  const size = 550;
  const { ImageResponse } = await import('@vercel/og');

  const baseImage = new ImageResponse(
    (
      <BuilderShareImage
        activities={activities}
        builderScouts={builderScouts}
        stats={stats}
        nftImageUrl={`data:image/png;base64,${avatarBuffer.toString('base64')}`}
        size={size}
        builderPrice={builderPrice}
      />
    ),
    {
      width: size,
      height: size,
      emoji: 'noto'
    }
  );

  const baseImageBuffer = await baseImage.arrayBuffer();
  const imageBuffer = await sharp(Buffer.from(baseImageBuffer)).png().toBuffer();

  return imageBuffer;
}
