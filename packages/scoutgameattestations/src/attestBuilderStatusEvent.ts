import { prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';

import { attestOnchain } from './attestOnchain';
import { scoutGameAttestationChainId, scoutGameBuilderEventSchemaUid } from './constants';
import { createOrGetUserProfileAttestation } from './createOrGetUserProfileAttestation';
import type { BuilderStatusEventAttestation } from './easSchemas/builderStatusEventSchema';
import { encodeBuilderStatusEventAttestation } from './easSchemas/builderStatusEventSchema';
import { attestationLogger } from './logger';

export async function attestBuilderStatusEvent({
  builderId,
  event
}: {
  builderId: string;
  event: BuilderStatusEventAttestation;
}): Promise<void> {
  try {
    const builderStatusEventAttestationData = encodeBuilderStatusEventAttestation(event);

    const userAttestation = await createOrGetUserProfileAttestation({
      scoutId: builderId
    });

    const attestationUid = await attestOnchain({
      schemaId: scoutGameBuilderEventSchemaUid(),
      recipient: NULL_EVM_ADDRESS,
      refUID: userAttestation.id as `0x${string}`,
      data: builderStatusEventAttestationData,
      chainId: scoutGameAttestationChainId
    });

    await prisma.builderStatusEvent.create({
      data: {
        attestationUid,
        chainId: scoutGameAttestationChainId,
        status: event.type,
        builderId
      }
    });
  } catch (err) {
    attestationLogger.error('Error attesting builder status event', { error: err, builderId, event });
  }
}
