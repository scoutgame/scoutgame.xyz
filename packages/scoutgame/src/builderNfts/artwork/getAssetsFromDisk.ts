import fs from 'fs';
import path from 'path';

import type { Font } from 'satori';

export function getAssetsFromDisk() {
  const folder = process.env.NFT_ASSETS_FOLDER || path.join(path.resolve(__dirname, '../../'), 'assets');
  const overlayFiles = fs.readdirSync(`${folder}/overlays`);
  const overlaysBase64 = overlayFiles.map((file) => {
    const filePath = path.join(`${folder}/overlays`, file);
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  });
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
  return { font, noPfpAvatarBase64, overlaysBase64 };
}
