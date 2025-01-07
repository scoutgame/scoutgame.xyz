import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

import { getBuilderActivities } from '../../builders/getBuilderActivities';
import { getBuilderNft } from '../../builders/getBuilderNft';
import { getBuilderScouts } from '../../builders/getBuilderScouts';
import { getBuilderStats } from '../../builders/getBuilderStats';
import { getBuilderNftStarterPackContractAddress } from '../constants';

import { generateShareImage } from './generateShareImage';
import { generateNftStarterPackImage } from './generateStarterPackNftImage';
import { getNftCongratsPath, getNftTokenUrlPath, imageDomain } from './utils';

export async function uploadStarterPackArtwork({
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
  const imageBuffer = await generateNftStarterPackImage({
    avatar,
    displayName
  });

  const imagePath = getNftTokenUrlPath({
    season,
    tokenId: Number(tokenId),
    filename: 'starter-pack-artwork.png',
    contractName: getBuilderNftStarterPackContractAddress()
  });

  await uploadFileToS3({
    pathInS3: `nft/${imagePath}`,
    bucket: process.env.SCOUTGAME_S3_BUCKET,
    content: imageBuffer,
    contentType: 'image/png'
  });

  return `${imageDomain}/${imagePath}`;
}

export async function uploadStarterPackArtworkCongrats({
  season,
  tokenId,
  userImage,
  builderId
}: {
  season: string;
  tokenId: bigint | number;
  userImage: string;
  builderId: string;
}) {
  const activities = await getBuilderActivities({ builderId, limit: 3 });
  const stats = await getBuilderStats(builderId);
  const builderScouts = await getBuilderScouts(builderId);
  const builderNft = await getBuilderNft(builderId);

  const imageBuffer = await generateShareImage({
    userImage,
    activities,
    stats,
    builderScouts,
    builderPrice: builderNft?.currentPrice || BigInt(0)
  });

  const imagePath = getNftCongratsPath({
    season,
    tokenId: Number(tokenId),
    starterPack: true,
    contractName: getBuilderNftStarterPackContractAddress()
  });

  await uploadFileToS3({
    pathInS3: `nft/${imagePath}`,
    bucket: process.env.SCOUTGAME_S3_BUCKET,
    content: imageBuffer,
    contentType: 'image/png'
  });

  return `${imageDomain}/${imagePath}`;
}
