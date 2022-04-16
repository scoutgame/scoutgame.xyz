
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Block } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteBlock);

async function deleteBlock (req: NextApiRequest, res: NextApiResponse<Block>) {
  const deleted = await prisma.block.delete({
    where: {
      id: req.query.id as string
    }
  });

  const blockIds = (await prisma.block.findMany({
    where: {
      OR: [
        {
          rootId: req.query.id as string
        },
        {
          parentId: req.query.id as string
        }
      ]
    },
    select: {
      id: true
    }
  })).map(block => block.id);

  await prisma.block.deleteMany({
    where: {
      OR: [
        {
          id: {
            in: blockIds
          }
        },
        {
          parentId: {
            in: blockIds
          }
        }
      ]
    }
  });

  return res.status(200).json(deleted);
}

export default withSessionRoute(handler);
