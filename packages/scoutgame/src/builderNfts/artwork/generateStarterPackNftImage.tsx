// Must be there otherwise React is not defined error is thrown
import type { ISOWeek } from '@packages/dates/config';
import React from 'react';
import sharp from 'sharp';

import { calculateFontSize, getAssetsFromDisk } from './getAssetsFromDisk';

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
  displayName,
  season
}: {
  season: ISOWeek;
  avatar: string;
  displayName: string;
}): Promise<Buffer> {
  const { starterOverlayBase64, font } = getAssetsFromDisk({ season });
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
          src={`data:image/png;base64,${avatarBuffer.toString('base64')}`}
          style={{
            width: 300,
            height: 300
          }}
        />
        <img
          src={starterOverlayBase64}
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
