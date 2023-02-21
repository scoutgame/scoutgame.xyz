import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { ClientUserSpaceNotifications } from 'lib/profile/notifications/spaceNotifications';
import { getUserSpaceNotifications } from 'lib/profile/notifications/spaceNotifications';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getNotifications);

async function getNotifications(req: NextApiRequest, res: NextApiResponse<ClientUserSpaceNotifications>) {
  const { spaceId } = req.query;

  if (typeof spaceId !== 'string') {
    throw new InvalidInputError('spaceId must be a string');
  }

  const settings = await getUserSpaceNotifications({
    spaceId,
    userId: req.session.user.id
  });

  res.status(200).json(settings);
}

export default withSessionRoute(handler);
