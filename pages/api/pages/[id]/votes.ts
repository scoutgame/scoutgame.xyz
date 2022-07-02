import { NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { getPageVotes } from 'lib/votes';
import { ExtendedVote } from 'lib/votes/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getVotes);

async function getVotes (req: NextApiRequest, res: NextApiResponse<ExtendedVote[]>) {
  const pageId = req.query.id as string;

  const computed = await computeUserPagePermissions({
    pageId,
    userId: req.session?.user?.id
  });

  if (computed.read !== true) {
    throw new NotFoundError('Page not found');
  }

  const votes = await getPageVotes(pageId);

  return res.status(200).json(votes);
}

export default withSessionRoute(handler);
