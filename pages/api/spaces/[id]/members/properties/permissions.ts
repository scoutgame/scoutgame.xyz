import type { MemberPropertyPermission } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createMemberPropertyPermission } from 'lib/members/createMemberPropertyPermission';
import { deleteMemberPropertyPermission } from 'lib/members/deleteMemberPropertyPermission';
import type { CreateMemberPropertyPermissionInput } from 'lib/members/interfaces';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createMemberPropertyPermissionHandler)
  .delete(deleteMemberPropertyPermissionHandler);

async function createMemberPropertyPermissionHandler (req: NextApiRequest, res: NextApiResponse<MemberPropertyPermission>) {
  const permissionData = req.body as CreateMemberPropertyPermissionInput;

  const permission = await createMemberPropertyPermission(permissionData);

  return res.status(201).json(permission);
}

async function deleteMemberPropertyPermissionHandler (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.body as { id: string };

  await deleteMemberPropertyPermission(id);

  return res.status(200).json({
    success: true
  });
}

export default withSessionRoute(handler);
