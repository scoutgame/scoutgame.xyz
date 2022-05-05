
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions, setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { Block, Page } from '@prisma/client';
import { prisma } from 'db';
import { ChildModificationAction, modifyChildPages } from 'lib/pages/modifyChildPages';

export interface DeletePageResponse {
  deletedPageIds: string[]
  rootBlock: Block | null
}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['id'], 'query'))
  .put(updatePage)
  .delete(deletePage);

async function updatePage (req: NextApiRequest, res: NextApiResponse) {

  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  const updateContent = req.body as Page ?? {};

  if ((typeof updateContent.index === 'number' || updateContent.parentId !== undefined) && permissions.edit_position !== true) {
    throw new ActionNotPermittedError('You are not allowed to reposition this page');
  }

  // eslint-disable-next-line
  if (updateContent.isPublic != undefined && permissions.edit_isPublic !== true) {
    return res.status(401).json({
      error: 'You cannot update the public status of this page'
    });
  }
  else if (permissions.edit_content !== true) {
    return res.status(401).json({
      error: 'You cannot update this page'
    });
  }
  const pageWithPermission = await prisma.page.update({
    where: {
      id: pageId
    },
    data: req.body,
    include: {
      permissions: true
    }
  });

  if (updateContent.parentId === null || typeof updateContent.parentId === 'string') {
    const updatedPage = await setupPermissionsAfterPageRepositioned(pageId);
    return res.status(200).json(updatedPage);
  }

  return res.status(200).json(pageWithPermission);
}

async function deletePage (req: NextApiRequest, res: NextApiResponse<DeletePageResponse>) {
  const pageId = req.query.id as string;
  const childModificationAction = req.query.action as ChildModificationAction;
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.delete !== true) {
    throw new ActionNotPermittedError('You are not allowed to delete this page.');
  }

  const rootBlock = await prisma.block.findUnique({
    where: {
      id: pageId
    }
  });

  const modifiedChildPageIds = await modifyChildPages(pageId, userId, childModificationAction);

  return res.status(200).json({ deletedPageIds: modifiedChildPageIds, rootBlock });
}

export default withSessionRoute(handler);
