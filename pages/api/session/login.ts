import { prisma } from 'db';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';

import { trackUserAction } from 'lib/metrics/mixpanel/server';
import { onError, onNoMatch, requireKeys, ActionNotPermittedError } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import type { LoggedInUser } from 'models';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { getAddress, toUtf8Bytes, verifyMessage } from 'ethers/lib/utils';
import { SiweMessage } from 'lit-siwe';
import { lowerCaseEqual } from 'lib/utilities/strings';
import type { Web3LoginRequest } from 'lib/middleware/requireWalletSignature';
import { requireWalletSignature } from 'lib/middleware/requireWalletSignature';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireWalletSignature)
  .post(login);

async function login (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const { address } = req.body as Web3LoginRequest;

  const user = await prisma.user.findFirst({
    where: {
      wallets: {
        some: {
          address
        }
      }
    },
    include: sessionUserRelations
  });

  if (!user) {
    throw new ActionNotPermittedError('No user has been associated with this wallet address');
  }

  req.session.user = { id: user.id };
  await updateGuildRolesForUser(user.wallets.map(w => w.address), user.spaceRoles);
  await req.session.save();

  trackUserAction('sign_in', { userId: user.id, identityType: 'Wallet' });

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
