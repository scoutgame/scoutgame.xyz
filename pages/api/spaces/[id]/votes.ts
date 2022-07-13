import { getVotesBySpace } from 'lib/votes';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Vote } from '@prisma/client';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getVotes);

async function getVotes (req: NextApiRequest, res: NextApiResponse<Vote[]>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id as string;

  const votes = await getVotesBySpace({ spaceId, userId });

  return res.status(200).json(votes);
}

export default withSessionRoute(handler);
