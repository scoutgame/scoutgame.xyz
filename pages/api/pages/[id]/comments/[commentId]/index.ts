import type { PageComment } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { UpdatePostCommentInput } from 'lib/forums/comments/interface';
import { PostNotFoundError } from 'lib/forums/posts/errors';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { deletePageComment } from 'lib/pages/comments/deletePageComment';
import { getPageComment } from 'lib/pages/comments/getPageComment';
import { updatePageComment } from 'lib/pages/comments/updatePageComment';
import { withSessionRoute } from 'lib/session/withSession';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError, UndesirableOperationError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePageCommentHandler).delete(deletePageCommentHandler);

async function updatePageCommentHandler(req: NextApiRequest, res: NextApiResponse<PageComment>) {
  const { commentId, id: pageId } = req.query as any as { id: string; commentId: string };
  const body = req.body as UpdatePostCommentInput;
  const userId = req.session.user.id;

  const page = await prisma.page.findUnique({
    where: { id: pageId }
  });

  if (!page) {
    throw new DataNotFoundError(pageId);
  }

  const spaceRole = await hasAccessToSpace({
    spaceId: page.spaceId,
    userId
  });

  if (!spaceRole.success) {
    throw new UserIsNotSpaceMemberError();
  }

  const comment = await getPageComment(commentId);

  if (comment?.createdBy !== userId) {
    throw new ActionNotPermittedError(`You cannot edit other peoples' comments`);
  }

  if (comment.deletedAt) {
    throw new UndesirableOperationError("Can't edit deleted comments");
  }

  const pageComment = await updatePageComment({ commentId, ...body });

  res.status(200).json(pageComment);
}

async function deletePageCommentHandler(req: NextApiRequest, res: NextApiResponse) {
  const { commentId, id: pageId } = req.query as any as { id: string; commentId: string };
  const userId = req.session.user.id;

  const page = await prisma.post.findUnique({
    where: { id: pageId }
  });

  if (!page) {
    throw new PostNotFoundError(pageId);
  }

  const pageComment = await prisma.pageComment.findUnique({
    where: { id: commentId },
    include: {
      page: {
        select: {
          spaceId: true
        }
      }
    }
  });

  if (!pageComment) {
    throw new DataNotFoundError(`Comment with id ${commentId} not found`);
  }

  if (pageComment.createdBy === userId) {
    await deletePageComment({ commentId, userId });
  } else {
    throw new ActionNotPermittedError('You do not have permission to delete this comment.');
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
