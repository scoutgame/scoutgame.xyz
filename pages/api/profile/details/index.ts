
import { UserDetails } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(createUserDetails)
  .use(requireUser)
  .get(getUserDetails);
  .put(updateUserDetails);

  export async function createUserDetails (req: NextApiRequest, res: NextApiResponse<UserDetails | { error: any }>) {

    const { id } = req.body;
  
    let details: UserDetails = await prisma.userDetails.create({
      data: {
        id
      }
    });

    res.status(200).json(details);
  }

async function getUserDetails (req: NextApiRequest, res: NextApiResponse<UserDetails | { error: any }>) {
  const details = await prisma.userDetails.findUnique({
    where: {
      id: req.session.user.id
    }
  });
  if (!details) {
    return res.status(404).json({ error: 'No user details found' });
  }
  return res.status(200).json(details);
}

async function updateUserDetails (req: NextApiRequest, res: NextApiResponse<UserDetails | {error: string}>) {

  const details = await prisma.userDetails.upsert({
    where: {
      id: req.session.user.id
    },
    create: {
      id: req.session.user.id
    },
    update: {
      ...req.body
    },
  });

  return res.status(200).json(details);
}

export default withSessionRoute(handler);
