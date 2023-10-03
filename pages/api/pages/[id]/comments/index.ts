import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CreateCommentInput } from 'lib/comments';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { createPageComment } from 'lib/pages/comments/createPageComment';
import type { PageCommentWithVote } from 'lib/pages/comments/interface';
import { listPageComments } from 'lib/pages/comments/listPageComments';
import { PageNotFoundError } from 'lib/pages/server';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'page'
    })
  )
  .get(listPageCommentsHandler)
  .use(requireUser)
  .post(createPageCommentHandler);

async function listPageCommentsHandler(req: NextApiRequest, res: NextApiResponse<PageCommentWithVote[]>) {
  const { id: pageId } = req.query as any as { id: string };

  const userId = req.session.user?.id;

  const permissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.read !== true) {
    throw new ActionNotPermittedError('You do not have permission to view this page');
  }

  const pageCommentsWithVotes = await listPageComments({ pageId, userId });

  res.status(200).json(pageCommentsWithVotes);
}

async function createPageCommentHandler(req: NextApiRequest, res: NextApiResponse<PageCommentWithVote>) {
  const { id: pageId } = req.query as any as { id: string };
  const body = req.body as CreateCommentInput;
  const userId = req.session.user.id;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { spaceId: true, type: true, proposalId: true }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const permissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.comment !== true) {
    throw new ActionNotPermittedError('You do not have permission to comment on this page');
  }

  const pageComment = await createPageComment({ pageId, userId, ...body });

  if (page.type === 'proposal' && page.proposalId) {
    await publishProposalEvent({
      commentId: pageComment.id,
      scope: WebhookEventNames.ProposalCommentCreated,
      proposalId: page.proposalId,
      spaceId: page.spaceId
    });
  }

  res.status(200).json({
    ...pageComment,
    upvoted: null,
    upvotes: 0,
    downvotes: 0
  });
}

export default withSessionRoute(handler);
