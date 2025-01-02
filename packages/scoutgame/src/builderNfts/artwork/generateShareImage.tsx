import React from 'react';
// Must be there otherwise React is not defined error is thrown
import sharp from 'sharp';

import type { BuilderActivity } from '../../builders/getBuilderActivities';
import type { BuilderScouts } from '../../builders/getBuilderScouts';
import type { BuilderStats } from '../../builders/getBuilderStats';

import { BuilderShareImage } from './components/BuilderShareImage';
import { getAssetsFromDisk } from './getAssetsFromDisk';

export async function generateShareImage({
  userImage,
  activities,
  builderPrice,
  stats,
  builderScouts
}: {
  userImage: string | null;
  activities: BuilderActivity[];
  stats: BuilderStats;
  builderScouts: BuilderScouts;
  builderPrice: bigint;
}): Promise<Buffer> {
  let avatarBuffer: Buffer | null = null;
  const size = 550;

  const { noPfpAvatarBase64 } = getAssetsFromDisk();

  if (userImage) {
    const response = await fetch(userImage);
    const arrayBuffer = await response.arrayBuffer();
    avatarBuffer = await sharp(Buffer.from(arrayBuffer)).resize(150, 200).png().toBuffer();
  }

  const { ImageResponse } = await import('@vercel/og');

  const baseImage = new ImageResponse(
    (
      <BuilderShareImage
        activities={activities}
        builderScouts={builderScouts}
        stats={stats}
        nftImageUrl={avatarBuffer ? `data:image/png;base64,${avatarBuffer.toString('base64')}` : noPfpAvatarBase64}
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
