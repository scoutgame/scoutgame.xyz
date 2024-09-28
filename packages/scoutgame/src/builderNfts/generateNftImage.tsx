import fs from 'fs';
import path from 'path';

import { ImageResponse } from 'next/og';
// Must be there otherwise React is not defined error is thrown
import React from 'react';
import type { Font } from 'satori';
import sharp from 'sharp';

const OVERLAY_FOLDER = path.join(path.resolve(__dirname, '../'), 'assets', 'overlays');
const overlayFiles = fs.readdirSync(OVERLAY_FOLDER);
const overlaysBase64 = overlayFiles.map((file) => {
  const filePath = path.join(OVERLAY_FOLDER, file);
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
});
const noPfpAvatarFile = path.join(path.resolve(__dirname, '../'), 'assets', 'no_pfp_avatar.png');
const noPfpAvatarBase64 = `data:image/png;base64,${fs.readFileSync(noPfpAvatarFile).toString('base64')}`;
const fontPath = path.join(path.resolve(__dirname, '../'), 'assets', 'fonts', 'K2D-Medium.ttf');
const fontBuffer = fs.readFileSync(fontPath);
const font: Font = {
  name: 'K2D',
  data: fontBuffer,
  style: 'normal',
  weight: 400
};

// Function to determine font size
function calculateFontSize(text: string, maxWidth: number, initialFontSize: number): number {
  const minFontSize = 10;
  let fontSize = initialFontSize;

  while (fontSize > minFontSize) {
    if (text.length * fontSize * 0.6 < maxWidth) {
      return fontSize;
    }
    fontSize -= 1;
  }

  return minFontSize;
}

export async function generateNftImage({
  avatar,
  username
}: {
  avatar: string | null;
  username: string;
}): Promise<Buffer> {
  const randomOverlay = overlaysBase64[Math.floor(Math.random() * overlaysBase64.length)];
  let avatarBuffer: Buffer | null = null;
  const cutoutWidth = 300;
  const cutoutHeight = 400;

  if (avatar) {
    const response = await fetch(avatar);
    const arrayBuffer = await response.arrayBuffer();
    const { width, height } = await sharp(Buffer.from(arrayBuffer)).metadata();

    const aspectRatio = width && height ? width / height : 3 / 4;

    let newHeight = Math.max(cutoutHeight, Math.round(cutoutWidth / aspectRatio));
    let newWidth = Math.round(newHeight * aspectRatio);

    if (newWidth < cutoutWidth) {
      newWidth = cutoutWidth;
      newHeight = Math.round(newWidth / aspectRatio);
    }

    avatarBuffer = await sharp(Buffer.from(arrayBuffer))
      .resize({ width: newWidth, height: newHeight, fit: 'cover' })
      .png()
      .toBuffer();
  }

  const baseImage = new ImageResponse(
    (
      <div
        style={{
          height: cutoutHeight,
          width: cutoutWidth,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <img
          src={avatarBuffer ? `data:image/png;base64,${avatarBuffer.toString('base64')}` : noPfpAvatarBase64}
          style={{
            width: cutoutWidth,
            height: cutoutHeight,
            objectFit: 'cover'
          }}
        />
        <img
          src={randomOverlay}
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
              fontSize: `${calculateFontSize(username, 280, 24)}px`,
              whiteSpace: 'nowrap',
              maxWidth: `${280}px`,
              fontFamily: 'K2D'
            }}
          >
            {username}
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
  const imageBuffer = sharp(Buffer.from(baseImageBuffer)).png().toBuffer();

  return imageBuffer;
}
