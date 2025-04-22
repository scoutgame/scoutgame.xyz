import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

import { getBuilderActivities } from '../../builders/getBuilderActivities';
import { getBuilderNft } from '../../builders/getBuilderNft';
import { getBuilderScouts } from '../../builders/getBuilderScouts';
import { getBuilderStats } from '../../builders/getBuilderStats';
import { devTokenDecimals } from '../../protocol/constants';
import { convertCostToPoints } from '../utils';

import { builderNftArtworkContractName } from './constants';
import { generateShareImage } from './generateShareImage';
import { getShareImagePath, imageDomain } from './utils';

export async function uploadShareImage({
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
  const [activities, stats, builderScouts, builderNft] = await Promise.all([
    getBuilderActivities({ builderId, limit: 3 }),
    getBuilderStats(builderId),
    getBuilderScouts(builderId),
    getBuilderNft(builderId)
  ]);

  const imageBuffer = await generateShareImage({
    userImage,
    activities,
    stats,
    builderScouts,
    builderPrice: (Number(builderNft?.currentPrice || 0) / 10 ** devTokenDecimals).toFixed(2)
  });

  const imagePath = getShareImagePath({
    season,
    tokenId: Number(tokenId),
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
