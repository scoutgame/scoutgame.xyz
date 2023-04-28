import log from 'lib/log';
import type { IPageWithPermissions } from 'lib/pages/interfaces';
import { getPage } from 'lib/pages/server';

import { mixpanel } from './mixpanel';

export async function updateTrackPageProfile(pageId: string) {
  try {
    const page = await getPage(pageId);

    if (page) {
      mixpanel?.groups.set('Page Id', page.id, getTrackPageProfile(page));
    }
  } catch (e) {
    log.warn(`Failed to update mixpanel profile for group id ${pageId}`);
  }
}

export function getTrackPageProfile(page: IPageWithPermissions) {
  const isPublic = page.permissions.some((p) => p.public);

  return {
    $created: page.createdAt,
    $name: page.title,
    Title: page.title,
    Type: page.type,
    Deleted: !!page.deletedAt,
    Public: isPublic,
    'Is Database': ['board', 'inline_board', 'inline_linked_board', 'linked_board'].includes(page.type),
    'Page Created By': page.createdBy,
    'Page Updated At': page.updatedAt
  };
}
