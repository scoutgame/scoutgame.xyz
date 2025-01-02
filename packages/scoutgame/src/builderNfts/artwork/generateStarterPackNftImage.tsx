import fs from 'fs';
import path from 'path';

// Must be there otherwise React is not defined error is thrown
import { isTruthy } from '@packages/utils/types';
import React from 'react';
import type { Font } from 'satori';
import sharp from 'sharp';

import type { BuilderActivity } from '../../builders/getBuilderActivities';
import type { BuilderScouts } from '../../builders/getBuilderScouts';
import type { BuilderStats } from '../../builders/getBuilderStats';
import { getCurrentSeasonStart } from '../../dates/utils';

import { BuilderShareImage } from './components/BuilderShareImage';

// fails inside of Next.js
function getAssetsFromDisk() {
  const currentSeason = getCurrentSeasonStart();
  const folder = process.env.NFT_ASSETS_FOLDER || path.join(path.resolve(__dirname, '../../../'), 'assets');
  const overlaysFolder = `${folder}/overlays/${currentSeason}`;
  const overlayFiles = fs.readdirSync(overlaysFolder);
  const overlaysBase64 = overlayFiles
    .map((file) => {
      if (file === 'starter_pack.png') {
        return null;
      }
      const filePath = path.join(overlaysFolder, file);
      const data = fs.readFileSync(filePath);
      return `data:image/png;base64,${data.toString('base64')}`;
    })
    .filter(isTruthy);
  const starterPackOverlay = `${overlaysFolder}/starter_pack.png`;
  const starterPackOverlayBase64 = `data:image/png;base64,${fs.readFileSync(starterPackOverlay).toString('base64')}`;
  const noPfpAvatarFile = `${folder}/no_pfp_avatar.png`;
  const noPfpAvatarBase64 = `data:image/png;base64,${fs.readFileSync(noPfpAvatarFile).toString('base64')}`;
  const fontPath = `${folder}/fonts/K2D-Medium.ttf`;
  const fontBuffer = fs.readFileSync(fontPath);
  const font: Font = {
    name: 'K2D',
    data: fontBuffer,
    style: 'normal',
    weight: 400
  };
  return { font, noPfpAvatarBase64, overlaysBase64, starterPackOverlayBase64 };
}

// Function to determine font size
function calculateFontSize(text: string, maxWidth: number, initialFontSize: number): number {
  const minFontSize = 12;
  let fontSize = initialFontSize;

  while (fontSize > minFontSize) {
    if (text.length * fontSize * 0.6 < maxWidth) {
      return fontSize;
    }
    fontSize -= 1;
  }

  return minFontSize;
}

export async function updateNftStarterPackImage({
  displayName,
  currentNftImage
}: {
  currentNftImage: string;
  displayName: string;
}): Promise<Buffer> {
  const cutoutWidth = 300;
  const cutoutHeight = 400;

  const { ImageResponse } = await import('@vercel/og');

  const baseImage = new ImageResponse(
    (
      <div
        style={{
          height: cutoutHeight,
          width: cutoutWidth,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: 'white'
        }}
      >
        <img
          src={currentNftImage}
          width={cutoutWidth}
          height={cutoutHeight}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        <div
          style={{
            width: cutoutWidth - 20,
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'black',
            flexDirection: 'row',
            bottom: 40,
            position: 'absolute',
            paddingLeft: 10,
            paddingRight: 10
          }}
        >
          <p
            style={{
              color: 'white',
              textAlign: 'center',
              fontSize: `${calculateFontSize(displayName, 280, 24)}px`,
              whiteSpace: 'nowrap',
              maxWidth: `${280}px`
            }}
          >
            {displayName}
          </p>
        </div>
      </div>
    ),
    {
      width: cutoutWidth,
      height: cutoutHeight
    }
  );

  const baseImageBuffer = await baseImage.arrayBuffer();
  const imageBuffer = await sharp(Buffer.from(baseImageBuffer)).png().toBuffer();

  return imageBuffer;
}

export async function generateNftStarterPackImage({
  avatar,
  displayName
}: {
  avatar: string | null;
  displayName: string;
}): Promise<Buffer> {
  const { overlaysBase64, noPfpAvatarBase64, font } = getAssetsFromDisk();
  let avatarBuffer: Buffer | null = null;
  const cutoutWidth = 300;
  const cutoutHeight = 400;

  if (avatar) {
    const response = await fetch(avatar);
    const arrayBuffer = await response.arrayBuffer();
    avatarBuffer = await sharp(Buffer.from(arrayBuffer)).resize(300, 300).png().toBuffer();
  }

  const { ImageResponse } = await import('@vercel/og');

  const baseImage = new ImageResponse(
    (
      <div
        style={{
          height: cutoutHeight,
          width: cutoutWidth,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: 'white'
        }}
      >
        <img
          src={avatarBuffer ? `data:image/png;base64,${avatarBuffer.toString('base64')}` : noPfpAvatarBase64}
          style={{
            width: 300,
            height: 300
          }}
        />
        <img
          src={overlaysBase64[overlaysBase64.length - 1]}
          width={cutoutWidth}
          height={cutoutHeight}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'row',
            bottom: 40,
            position: 'absolute',
            paddingLeft: 10,
            paddingRight: 10
          }}
        >
          <p
            style={{
              color: 'white',
              textAlign: 'center',
              fontSize: `${calculateFontSize(displayName, 280, 24)}px`,
              whiteSpace: 'nowrap',
              maxWidth: `${280}px`,
              fontFamily: 'K2D'
            }}
          >
            {displayName}
          </p>
        </div>
      </div>
    ),
    {
      width: cutoutWidth,
      height: cutoutHeight,
      fonts: [font]
    }
  );

  const baseImageBuffer = await baseImage.arrayBuffer();
  const imageBuffer = await sharp(Buffer.from(baseImageBuffer)).png().toBuffer();

  return imageBuffer;
}

export async function generateNftStarterPackCongrats({
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
  // Just for testing
  // const activities = await getBuilderActivities({ builderId: '745c9ffd-278f-4e91-8b94-beaded2ebcd1', limit: 3 });
  // const stats = await getBuilderStats('745c9ffd-278f-4e91-8b94-beaded2ebcd1');
  // const builderScouts = await getBuilderScouts('745c9ffd-278f-4e91-8b94-beaded2ebcd1');
  // const builderNft = await getBuilderNft('745c9ffd-278f-4e91-8b94-beaded2ebcd1');

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
