import type { PageMeta } from '@charmverse/core/pages';
import { pageTree } from '@charmverse/core/pages/utilities';
import type { Space } from '@charmverse/core/prisma';
import { PageType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { StaticPageType, PageEventMap } from 'lib/metrics/mixpanel/interfaces/PageEvent';
import { filterVisiblePages } from 'lib/pages/filterVisiblePages';
import { getPermissionsClient } from 'lib/permissions/api/routers';
import { getSpaceUrl } from 'lib/utilities/browser';

type ViewMeta = PageEventMap['page_view']['meta'];

const staticPagesToDirect: { [key in StaticPageType]?: string } = {
  bounties_list: '/bounties',
  forum_posts_list: '/forum',
  members_list: '/members',
  proposals_list: '/proposals'
};

const pageTypes = Object.keys(PageType).concat('post', ...Object.keys(staticPagesToDirect));

// get default page when we have a space domain
export async function getDefaultPageForSpace({
  space,
  host,
  userId
}: {
  space: Pick<Space, 'id' | 'domain' | 'customDomain'>;
  host?: string;
  userId: string;
}) {
  const { id: spaceId, domain } = space;
  const lastPageView = await getLastPageView({ userId, spaceId });

  const defaultSpaceUrl = getSpaceUrl(space, host);

  if (lastPageView) {
    const pathname = (lastPageView.meta as ViewMeta)?.pathname;
    if (pathname) {
      return pathname;
    }
    // reconstruct the URL if no pathname is saved (should not be an issue a few weeks after the release of this code on Sep 12 2023)
    // handle forum posts
    if (lastPageView.post) {
      return `${defaultSpaceUrl}/forum?postId=${lastPageView.post.id}`;
    }
    // handle pages
    else if (lastPageView.page) {
      return `${defaultSpaceUrl}/${lastPageView.page.path}`;
    }
    // handle static pages
    else {
      const staticPath = staticPagesToDirect[lastPageView.pageType as StaticPageType];
      if (staticPath) {
        return `${defaultSpaceUrl}${staticPath}`;
      }
    }
  }

  const { client } = await getPermissionsClient({
    resourceId: spaceId,
    resourceIdType: 'space'
  });

  const accessiblePageIds = await client.pages.getAccessiblePageIds({
    spaceId,
    userId,
    archived: false
  });

  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: accessiblePageIds
      }
    }
  });

  const pageMap = pages.reduce<Record<string, PageMeta>>((acc, page) => {
    acc[page.id] = page;
    return acc;
  }, {});

  // Find the first top-level page that is not card and hasn't been deleted yet.
  const topLevelPages = filterVisiblePages(pageMap);

  const sortedPages = pageTree.sortNodes(topLevelPages);
  const firstPage = sortedPages[0];

  if (firstPage) {
    return `${defaultSpaceUrl}/${firstPage.path}`;
  } else {
    return `${defaultSpaceUrl}/members`;
  }
}

function getLastPageView({ userId, spaceId }: { userId: string; spaceId?: string }) {
  return prisma.userSpaceAction.findFirst({
    where: {
      createdBy: userId,
      action: 'view_page',
      pageType: {
        in: pageTypes
      },
      spaceId
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      meta: true,
      spaceId: true,
      pageType: true,
      page: {
        select: {
          id: true,
          path: true
        }
      },
      post: {
        select: {
          id: true,
          path: true
        }
      }
    }
  });
}
