import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { SyncRelationPropertyPayload } from 'lib/focalboard/relationProperty/syncRelationProperty';
import { syncRelationProperty } from 'lib/focalboard/relationProperty/syncRelationProperty';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(syncRelationPropertyHandler);

async function syncRelationPropertyHandler(req: NextApiRequest, res: NextApiResponse) {
  const payload = req.body as SyncRelationPropertyPayload;

  const sourceBoard = await prisma.block.findUniqueOrThrow({
    where: {
      id: payload.boardId
    },
    select: {
      spaceId: true
    }
  });

  const spaceId = sourceBoard.spaceId;

  const { error } = await hasAccessToSpace({ userId: req.session.user.id, spaceId });
  if (error) {
    throw new UnauthorisedActionError();
  }

  await syncRelationProperty({
    ...payload,
    userId: req.session.user.id
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
