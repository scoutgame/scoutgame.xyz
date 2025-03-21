import fs from 'fs';
import path from 'path';

import { getCurrentSeasonStart } from '@packages/dates/utils';
import { isTruthy } from '@packages/utils/types';
import type { Font } from 'satori';

export function getAssetsFromDisk() {
  const currentSeason = getCurrentSeasonStart();
  const folder = process.env.NFT_ASSETS_FOLDER || path.join(path.resolve(__dirname, '../../../src'), 'assets');
  const overlaysFolder = `${folder}/overlays/${currentSeason}`;
  const overlayFiles = fs.readdirSync(overlaysFolder).filter((file) => file.endsWith('.png'));
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
export function calculateFontSize(text: string, maxWidth: number, initialFontSize: number): number {
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
