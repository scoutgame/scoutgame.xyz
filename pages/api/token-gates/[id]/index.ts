
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { TokenGate } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser, hasAccessToSpace } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .delete(deleteTokenGate);

async function deleteTokenGate (req: NextApiRequest, res: NextApiResponse) {

  const gate = await prisma.tokenGate.findFirst({
    where: {
      id: req.query.id as string
    }
  });
  if (!gate) {
    return res.status(404).json({ error: 'TokenGate not found' });
  }
  // check is admin
  const { error } = await hasAccessToSpace({
    userId: req.session.user.id,
    spaceId: gate.spaceId,
    role: 'admin'
  });
  if (error) {
    return res.status(401).json({ error });
  }
  await prisma.tokenGate.delete({
    where: {
      id: gate.id
    }
  });

  res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
