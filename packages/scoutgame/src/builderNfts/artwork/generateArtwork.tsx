// Must be there otherwise React is not defined error is thrown
import type { ISOWeek } from '@packages/dates/config';
import React from 'react';
import sharp from 'sharp';

import { getAssetsFromDisk } from './getAssetsFromDisk';

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

export async function generateArtwork({
  avatar,
  displayName,
  tokenId,
  season
}: {
  season: ISOWeek;
  avatar: string;
  tokenId: bigint | number;
  displayName: string;
}): Promise<Buffer> {
  const { overlaysBase64, noPfpAvatarBase64, font } = getAssetsFromDisk({ season });
  const overlay = overlaysBase64[Number(tokenId) % overlaysBase64.length];
  const response = await fetch(avatar);
  const avatarBuffer = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize(300, 300)
    .png()
    .toBuffer();
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
          src={avatarBuffer ? `data:image/png;base64,${avatarBuffer.toString('base64')}` : noPfpAvatarBase64}
          style={{
            width: 300,
            height: 300
          }}
        />
        <img
          src={overlay}
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
