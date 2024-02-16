import { prisma } from '@charmverse/core/prisma-client';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { DataNotFoundError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';

import { getValidTokenGateId } from './evaluateEligibility';
import type { TokenGateWithRoles } from './interfaces';

export type TokenGateResult = TokenGateWithRoles & { id: string; verified: boolean; grantedRoles: string[] };

type Props = {
  userId: string;
  spaceId: string;
  tokenGateIds: string[];
  walletAddress: string;
};

export async function verifyTokenGates({
  spaceId,
  userId,
  tokenGateIds,
  walletAddress
}: Props): Promise<TokenGateResult[]> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    include: {
      roles: true,
      tokenGates: {
        include: {
          tokenGateToRoles: {
            include: {
              role: true
            }
          }
        }
      }
    }
  });

  const { tokenGates } = space;

  // We need to have at least one token gate that succeeded in order to proceed
  if (tokenGates.length === 0) {
    trackUserAction('token_gate_verification', { result: 'fail', spaceId, userId });
    throw new DataNotFoundError('No token gates were found for this space.');
  }

  const verifiedTokenGates: TokenGateResult[] = (
    await Promise.all(
      tokenGateIds.map(async (tkId) => {
        const matchingTokenGate = tokenGates.find((g) => g.id === tkId) as TokenGateWithRoles | undefined;

        if (!matchingTokenGate) {
          return null;
        }

        const verified = await getValidTokenGateId(matchingTokenGate, walletAddress);

        return {
          ...matchingTokenGate,
          verified: true,
          grantedRoles: matchingTokenGate.tokenGateToRoles.map((tgr) => tgr.role.id)
        };

        return null;
      })
    )
  ).filter(isTruthy);

  return verifiedTokenGates;
}
