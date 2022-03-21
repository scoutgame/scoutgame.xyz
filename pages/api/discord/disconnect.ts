import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).post(disconnectDiscord);

async function disconnectDiscord (req: NextApiRequest, res: NextApiResponse) {
  await prisma.user.update({
    where: {
      id: req.session.user.id
    },
    data: {
      discord: {}
    }
  });

  res.status(200).json({ success: 'ok' });
}

export default withSessionRoute(handler);
