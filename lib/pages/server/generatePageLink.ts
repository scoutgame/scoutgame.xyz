import { prisma } from '@charmverse/core';
import type { Page, Space } from '@charmverse/core/dist/prisma';

import type { PageLink } from '../interfaces';

import { PageNotFoundError } from './errors';

export async function generatePageLink(pageIdOrPageWithSpaceId: string | (Page & { space: Space })): Promise<PageLink> {
  const pageWithSpace =
    typeof pageIdOrPageWithSpaceId === 'string'
      ? await prisma.page.findUnique({
          where: {
            id: pageIdOrPageWithSpaceId
          },
          include: {
            space: true
          }
        })
      : pageIdOrPageWithSpaceId;

  if (!pageWithSpace) {
    throw new PageNotFoundError(pageIdOrPageWithSpaceId as string);
  }

  const domain = process.env.DOMAIN;

  const pageUrl = `${domain}/${pageWithSpace.space?.domain}/${pageWithSpace.path}`;

  return {
    title: pageWithSpace.title,
    url: pageUrl
  };
}
