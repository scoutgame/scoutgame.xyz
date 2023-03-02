import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { duplicatePage } from 'lib/pages/duplicatePage';
import type { PageMeta } from 'lib/pages/server';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(duplicatePageRoute);

async function duplicatePageRoute(
  req: NextApiRequest,
  res: NextApiResponse<{ rootPageIds: string[]; pages: PageMeta[] }>
) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;
  const { parentId } = req.body as { parentId: string | undefined | null };

  const permissions = await computeUserPagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You are not allowed to edit this page.');
  }

  const { pages, rootPageIds } = await duplicatePage({ pageId, parentId });
  await Promise.all(pages.map((page) => updateTrackPageProfile(page.id)));

  // trackUserAction('create_page', {
  //   userId,
  //   spaceId: pageWithPermissions.spaceId,
  //   pageId: pageWithPermissions.id,
  //   type: pageWithPermissions.type
  // });

  return res.status(200).send({ pages, rootPageIds });
}

export default withSessionRoute(handler);
