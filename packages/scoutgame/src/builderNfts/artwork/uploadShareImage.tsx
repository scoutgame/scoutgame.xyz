import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';
import { getPlatform } from '@packages/utils/platform';

import { getBuilderActivities } from '../../builders/getBuilderActivities';
import { getBuilderNft } from '../../builders/getBuilderNft';
import { getBuilderScouts } from '../../builders/getBuilderScouts';
import { getBuilderStats } from '../../builders/getBuilderStats';
import { builderTokenDecimals } from '../constants';

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
  // Just for testing
  // const activities = await getBuilderActivities({ builderId: '745c9ffd-278f-4e91-8b94-beaded2ebcd1', limit: 3 });
  // const stats = await getBuilderStats('745c9ffd-278f-4e91-8b94-beaded2ebcd1');
  // const builderScouts = await getBuilderScouts('745c9ffd-278f-4e91-8b94-beaded2ebcd1');
  // const builderNft = await getBuilderNft('745c9ffd-278f-4e91-8b94-beaded2ebcd1');

  const platform = getPlatform();

  const imageBuffer = await generateShareImage({
    userImage,
    activities,
    stats,
    builderScouts,
    builderPrice:
      platform === 'onchain_webapp'
        ? (Number(builderNft?.currentPriceInScoutToken || 0) / 10 ** 18).toFixed(2)
        : (Number(builderNft?.currentPrice || 0) / 10 ** builderTokenDecimals).toFixed(2)
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
