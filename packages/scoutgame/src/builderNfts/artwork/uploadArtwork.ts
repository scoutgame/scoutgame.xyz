import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

import { builderNftArtworkContractName } from './constants';
import { generateArtwork } from './generateArtwork';
import { getNftTokenUrlPath, imageDomain } from './utils';

export async function uploadArtwork({
  avatar,
  tokenId,
  season,
  displayName
}: {
  displayName: string;
  season: string;
  avatar: string;
  tokenId: bigint | number;
}) {
  const imageBuffer = await generateArtwork({
    avatar,
    displayName,
    tokenId
  });

  const imagePath = getNftTokenUrlPath({
    season,
    tokenId: Number(tokenId),
    filename: 'artwork.png',
    contractName: builderNftArtworkContractName || 'default'
  });

  await uploadFileToS3({
    pathInS3: `nft/${imagePath}`,
    bucket: process.env.SCOUTGAME_S3_BUCKET,
    content: imageBuffer,
    contentType: 'image/png'
  });

  return `${imageDomain}/${imagePath}`;
}
