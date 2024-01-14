import { hasAccessToSpace } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CreateCredentialTemplateInput } from 'lib/credentials/templates';
import { createCredentialTemplate, getCredentialTemplates, updateCredentialTemplate } from 'lib/credentials/templates';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';
import { AdministratorOnlyError } from 'lib/users/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'spaceId', location: 'query' }), getCredentialsController)
  .post(
    requireSpaceMembership({ adminOnly: true, spaceIdKey: 'spaceId', location: 'body' }),
    createCredentialController
  )
  .put(updateCredentialController)
  .delete(deleteCredentialController);

async function getCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const credentials = await getCredentialTemplates({ spaceId: req.query.spaceId as string });
  return res.status(200).json(credentials);
}

async function createCredentialController(req: NextApiRequest, res: NextApiResponse) {
  const signed = await createCredentialTemplate({
    ...(req.body as CreateCredentialTemplateInput),
    spaceId: req.body.spaceId as string
  });
  return res.status(201).json(signed);
}

async function updateCredentialController(req: NextApiRequest, res: NextApiResponse) {
  const credentialTemplate = await prisma.credentialTemplate.findUniqueOrThrow({
    where: {
      id: req.query.templateId as string
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  const { spaceRole } = await hasAccessToSpace({
    spaceId: credentialTemplate.spaceId
  });

  if (!spaceRole?.isAdmin) {
    throw new AdministratorOnlyError();
  }

  const signed = await updateCredentialTemplate({ templateId: credentialTemplate.id, fields: req.body });
  return res.status(200).json(signed);
}

async function deleteCredentialController(req: NextApiRequest, res: NextApiResponse) {
  const credentialTemplate = await prisma.credentialTemplate.findUniqueOrThrow({
    where: {
      id: req.query.templateId as string
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  const { spaceRole } = await hasAccessToSpace({
    spaceId: credentialTemplate.spaceId
  });

  if (!spaceRole?.isAdmin) {
    throw new AdministratorOnlyError();
  }

  await prisma.credentialTemplate.delete({
    where: {
      id: credentialTemplate.id
    }
  });
  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
