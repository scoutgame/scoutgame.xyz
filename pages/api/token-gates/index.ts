import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateTokenGateDetails } from 'lib/blockchain/updateTokenGateDetails';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys, requireSpaceMembership } from 'lib/middleware';
import requireValidation from 'lib/middleware/requireValidation';
import { withSessionRoute } from 'lib/session/withSession';
import type { TokenGateWithRoles } from 'lib/tokenGates/interfaces';
import { processTokenGateConditions } from 'lib/tokenGates/processTokenGateConditions';
import { DataNotFoundError, InvalidInputError } from 'lib/utils/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getTokenGates)
  .use(requireKeys(['spaceId', 'conditions'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true }))
  .use(requireValidation('tokenGateConditions'))
  .post(saveTokenGate);

async function saveTokenGate(req: NextApiRequest, res: NextApiResponse<void>) {
  const userId = req.session.user.id;
  const spaceId = req.body.spaceId;

  const { numberOfConditions, chainType, accesType, gateType } = processTokenGateConditions(req.body);

  await prisma.tokenGate.create({
    data: {
      createdBy: req.session.user.id,
      resourceId: {},
      ...req.body
    }
  });

  trackUserAction('add_a_gate', {
    userId,
    spaceId,
    accesType,
    chainType,
    gateType,
    numberOfConditions
  });

  res.status(200).end();
}

async function getTokenGates(req: NextApiRequest, res: NextApiResponse<TokenGateWithRoles[]>) {
  let space: Pick<Space, 'id'> | null = null;

  const { spaceDomain } = req.query;

  // Get space id using the domain
  if (spaceDomain) {
    space = await prisma.space.findFirst({
      where: {
        domain: req.query.spaceDomain as string
      },
      select: {
        id: true
      }
    });
    if (!space) {
      throw new DataNotFoundError(`Space with domain ${spaceDomain}`);
    }
  }

  const spaceId = space?.id || (req.query.spaceId as string);

  if (!spaceId) {
    throw new InvalidInputError('spaceId is required');
  }

  const result = (await prisma.tokenGate.findMany({
    where: {
      spaceId
    },
    include: {
      tokenGateToRoles: {
        include: {
          role: true
        }
      }
    }
  })) as any as TokenGateWithRoles[];

  const tokenGatesWithDetails = await updateTokenGateDetails(result);

  res.status(200).json(tokenGatesWithDetails);
}

export default withSessionRoute(handler);
