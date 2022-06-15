
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';

import { addSpaceOperations, SpacePermissionWithAssignee } from 'lib/permissions/spaces';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
//  .use(requireSpaceMembership)
  .post(addSpacePermissionsController);

async function addSpacePermissionsController (req: NextApiRequest, res: NextApiResponse<SpacePermissionWithAssignee>) {

  const { spaceId } = req.query;
  const { id: userId } = req.session.user;

  const { error } = await hasAccessToSpace({
    spaceId: spaceId as string,
    userId,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  const updatedPermission = await addSpaceOperations({
    forSpaceId: spaceId as string,
    // Unwind operations and assigned group
    ...req.body
  });

  return res.status(201).json(updatedPermission);
}

export default withSessionRoute(handler);
