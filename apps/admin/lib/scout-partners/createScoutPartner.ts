import type { ScoutPartner } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { uploadUrlToS3 } from '@packages/aws/uploadToS3Server';

import type { CreateScoutPartnerPayload } from './createScoutPartnerSchema';

export async function createScoutPartner(params: CreateScoutPartnerPayload): Promise<ScoutPartner> {
  const { repoIds, ...rest } = params;
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
      ...rest,
      infoPageImage: rest.infoPageImage || '',
      bannerImage: rest.bannerImage || ''
    }
  });

  // Associate repos with the partner
  if (repoIds && repoIds.length > 0) {
    await prisma.githubRepo.updateMany({
      where: { id: { in: repoIds } },
      data: { scoutPartnerId: partner.id }
    });
  }

  // Upload images with proper paths
  const [iconUrl, bannerUrl, infoPageUrl, tokenImageUrl] = await Promise.all([
    uploadUrlToS3({
      url: params.icon,
      pathInS3: `user-content/scout-partners/${partner.id}/icon.png`
    }),
    params.bannerImage
      ? uploadUrlToS3({
          url: params.bannerImage,
          pathInS3: `user-content/scout-partners/${partner.id}/developerPageBanner.png`
        })
      : Promise.resolve(null),
    params.infoPageImage
      ? uploadUrlToS3({
          url: params.infoPageImage,
          pathInS3: `user-content/scout-partners/${partner.id}/infoPageBanner.png`
        })
      : Promise.resolve(null),
    params.tokenImage
      ? uploadUrlToS3({
          url: params.tokenImage,
          pathInS3: `user-content/scout-partners/${partner.id}/tokenIcon.png`
        })
      : Promise.resolve(null)
  ]);

  // Update the partner with the new URLs
  return prisma.scoutPartner.update({
    where: { id: partner.id },
    data: {
      icon: iconUrl.url,
      infoPageImage: infoPageUrl?.url || '',
      ...(bannerUrl && { bannerImage: bannerUrl.url }),
      ...(tokenImageUrl && { tokenImage: tokenImageUrl.url })
    }
  });
}
