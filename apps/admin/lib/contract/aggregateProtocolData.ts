import { prisma } from '@charmverse/core/prisma-client';
import type { ProvableClaim } from '@charmverse/core/protocol';
import { getAllISOWeeksFromSeasonStart, getCurrentSeasonStart } from '@packages/dates/utils';
import { getProtocolReadonlyClient } from '@packages/scoutgame/protocol/clients/getProtocolReadonlyClient';
import { getProxyClient } from '@packages/scoutgame/protocol/clients/getProxyClient';
import { scoutProtocolAddress } from '@packages/scoutgame/protocol/constants';
import type { WeeklyClaimsTyped } from '@packages/scoutgame/protocol/generateWeeklyClaims';
import {
  scoutGameContributionReceiptSchemaUid,
  scoutGameUserProfileSchemaUid
} from '@packages/scoutgameattestations/constants';
import type { Address } from 'viem';

type MerkleRoot = {
  week: string;
  publishedOnchain: boolean;
  root: string | null;
  testClaim?: {
    claim: ProvableClaim;
    proofs: any[];
  };
};

export type ProtocolData = {
  admin: Address;
  proxy: Address;
  implementation: Address;
  claimsManager: Address;
  merkleRoots: MerkleRoot[];
  easSchemas: {
    profile: string;
    contributions: string;
  };
};

export async function aggregateProtocolData({ userId }: { userId?: string }): Promise<ProtocolData> {
  if (!scoutProtocolAddress) {
    throw new Error('REACT_APP_SCOUTPROTOCOL_CONTRACT_ADDRESS is not set');
  }

  const protocolProxyReadonlyApiClient = getProxyClient(scoutProtocolAddress);
  const protocolImplementationReadonlyApiClient = getProtocolReadonlyClient();

  const [implementation, admin, claimsManager] = await Promise.all([
    protocolProxyReadonlyApiClient.implementation(),
    protocolProxyReadonlyApiClient.admin(),
    protocolImplementationReadonlyApiClient.claimsManager()
  ]);

  const weeks = getAllISOWeeksFromSeasonStart({ season: getCurrentSeasonStart() });

  const weeklyClaims = await prisma.weeklyClaims.findMany({
    where: {
      week: {
        in: weeks
      }
    }
  });

  const merkleRoots = await Promise.all<MerkleRoot>(
    weeks.map((week) =>
      protocolImplementationReadonlyApiClient
        .getWeeklyMerkleRoot({ args: { week } })
        .then(async (root) => {
          const returnValue: MerkleRoot = { week, root, publishedOnchain: true };

          const weekFromDb = weeklyClaims.find((claim) => claim.week === week) as WeeklyClaimsTyped;

          if (userId && weekFromDb) {
            const userWallet = await prisma.scoutWallet.findFirst({ where: { scoutId: userId, primary: true } });
            if (userWallet) {
              const userClaim = weekFromDb.claims.leaves.find(
                (_claim) => _claim.address.toLowerCase() === userWallet?.address.toLowerCase()
              );

              const proofs = weekFromDb.proofsMap[userWallet.address.toLowerCase()];

              if (userClaim && proofs) {
                returnValue.testClaim = {
                  claim: userClaim,
                  proofs
                };
              }
            }
          }

          return returnValue;
        })
        .catch(() => {
          return {
            week,
            root: weeklyClaims.find((claim) => claim.week === week)?.merkleTreeRoot || null,
            publishedOnchain: false
          } as MerkleRoot;
        })
    )
  );

  return {
    merkleRoots,
    admin: admin as Address,
    proxy: scoutProtocolAddress,
    implementation: implementation as Address,
    claimsManager: claimsManager as Address,
    easSchemas: {
      contributions: scoutGameContributionReceiptSchemaUid(),
      profile: scoutGameUserProfileSchemaUid()
    }
  };
}
