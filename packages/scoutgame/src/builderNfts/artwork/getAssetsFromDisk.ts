import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getCurrentSeasonStart, getSeasonConfig } from '@packages/dates/utils';
import { isTruthy } from '@packages/utils/types';
import type { Font } from 'satori';

export function getAssetsFromDisk() {
  const seasonConfig = getSeasonConfig(getCurrentSeasonStart());
  // __dirname is not defined in ESM. Derive dirname from import.meta.url.
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const folder = process.env.NFT_ASSETS_FOLDER || path.join(path.resolve(__dirname, '../../../src'), 'assets');
  const overlaysFolder = `${folder}/overlays/${seasonConfig.start}`;
  const overlayFiles = fs.readdirSync(overlaysFolder).filter((file) => file.endsWith('.png'));
  const overlaysBase64 = overlayFiles
    .map((file) => {
      if (file === 'starter.png') {
        return null;
      }
      const filePath = path.join(overlaysFolder, file);
      const data = fs.readFileSync(filePath);
      return `data:image/png;base64,${data.toString('base64')}`;
    })
    .filter(isTruthy);
  const starterOverlay = `${overlaysFolder}/starter.png`;
  const starterOverlayBase64 = `data:image/png;base64,${fs.readFileSync(starterOverlay).toString('base64')}`;
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
  return { font, noPfpAvatarBase64, overlaysBase64, starterOverlayBase64 };
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
