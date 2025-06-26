import type { ScoutPartner, ScoutPartnerStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { uploadUrlToS3 } from '@packages/aws/uploadToS3Server';

export type CreateScoutPartnerPayload = {
  name: string;
  icon: string;
  bannerImage: string;
  infoPageImage: string;
  status: ScoutPartnerStatus;
  tokenAmountPerPullRequest?: number;
  tokenAddress?: string;
  tokenChain?: number;
  tokenSymbol?: string;
  tokenDecimals?: number;
  tokenImage?: string;
};

export async function createScoutPartner(params: CreateScoutPartnerPayload): Promise<ScoutPartner> {
  const id = params.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove all non-alphanumeric characters except spaces
    .trim() // Remove leading/trailing spaces
    .split(/\s+/) // Split by one or more spaces
    .filter(Boolean) // Remove empty strings
    .join('_'); // Join with underscore

  // Create the partner first to get the ID
  const partner = await prisma.scoutPartner.create({
    data: {
      id,
      ...params
    }
  });

  // Upload images with proper paths
  const [iconUrl, bannerUrl, infoPageUrl, tokenImageUrl] = await Promise.all([
    uploadUrlToS3({
      url: params.icon,
      pathInS3: `user-content/${partner.id}/icon.png`
    }),
    uploadUrlToS3({
      url: params.bannerImage,
      pathInS3: `user-content/${partner.id}/developerPageBanner.png`
    }),
    uploadUrlToS3({
      url: params.infoPageImage,
      pathInS3: `user-content/${partner.id}/infoPageBanner.png`
    }),
    params.tokenImage
      ? uploadUrlToS3({
          url: params.tokenImage,
          pathInS3: `user-content/${partner.id}/tokenIcon.png`
        })
      : Promise.resolve(null)
  ]);

  // Update the partner with the new URLs
  return prisma.scoutPartner.update({
    where: { id: partner.id },
    data: {
      icon: iconUrl.url,
      bannerImage: bannerUrl.url,
      infoPageImage: infoPageUrl.url,
      ...(tokenImageUrl && { tokenImage: tokenImageUrl.url })
    }
  });
}
