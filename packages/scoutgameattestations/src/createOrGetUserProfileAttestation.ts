import { prisma } from '@charmverse/core/prisma-client';
import {
  decodeScoutGameUserProfileAttestation,
  encodeScoutGameUserProfileAttestation,
  type ScoutGameUserProfileAttestation
} from '@packages/scoutgameattestations/easSchemas/scoutGameUserProfileSchema';

import { attestOnchain } from './attestOnchain';
import { scoutGameAttestationChainId, scoutGameUserProfileSchemaUid } from './constants';
import { getAttestation } from './getAttestation';
import { uploadScoutProfileToS3 } from './uploadScoutProfileToS3';

export async function createOrGetUserProfileAttestation({
  scoutId
}: {
  scoutId: string;
}): Promise<ScoutGameUserProfileAttestation> {
  const scout = await prisma.scout.findUniqueOrThrow({
    where: { id: scoutId },
    select: {
      onchainProfileAttestationChainId: true,
      onchainProfileAttestationUid: true,
      path: true,
      displayName: true
    }
  });

  if (scout.onchainProfileAttestationUid && scout.onchainProfileAttestationChainId === scoutGameAttestationChainId) {
    const attestation = await getAttestation({
      attestationUid: scout.onchainProfileAttestationUid,
      chainId: scoutGameAttestationChainId
    });

    return decodeScoutGameUserProfileAttestation(attestation.data);
  }

  const { metadataUrl } = await uploadScoutProfileToS3({
    scoutId,
    metadata: {
      displayName: scout.displayName,
      path: scout.path
    }
  });

  const data: ScoutGameUserProfileAttestation = {
    id: scoutId,
    metadataUrl
  };

  const attestationUid = await attestOnchain({
    schemaId: scoutGameUserProfileSchemaUid(),
    data: encodeScoutGameUserProfileAttestation(data),
    chainId: scoutGameAttestationChainId
  });

  await prisma.scout.update({
    where: {
      id: scoutId
    },
    data: {
      onchainProfileAttestationChainId: scoutGameAttestationChainId,
      onchainProfileAttestationUid: attestationUid
    }
  });

  return data;
}
