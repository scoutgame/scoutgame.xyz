import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

import { builderNftArtworkContractName } from './constants';
import { generateArtwork } from './generateArtwork';
import { getNftTokenUrlPath, imageDomain } from './utils';

export async function uploadArtwork({
  imageHostingBaseUrl,
  avatar,
  tokenId,
  season,
  displayName
}: {
  imageHostingBaseUrl?: string;
  displayName: string;
  season: string;
  avatar: string | null;
  tokenId: bigint | number;
}) {
  const imageBuffer = await generateArtwork({
    avatar,
    displayName,
    imageHostingBaseUrl,
    tokenId
  });

  const imagePath = getNftTokenUrlPath({
    season,
    tokenId: Number(tokenId),
    filename: 'artwork.png',
    contractName: builderNftArtworkContractName
  });

  await uploadFileToS3({
    pathInS3: `nft/${imagePath}`,
    bucket: process.env.SCOUTGAME_S3_BUCKET,
    content: imageBuffer,
    contentType: 'image/png'
  });

  return `${imageDomain}/${imagePath}`;
}
