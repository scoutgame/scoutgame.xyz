import { prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';

import { attestOnchain } from './attestOnchain';
import { scoutGameAttestationChainId, scoutGameBuilderEventSchemaUid } from './constants';
import { createOrGetUserProfileAttestation } from './createOrGetUserProfileAttestation';
import type { DeveloperStatusEventAttestation } from './easSchemas/developerStatusEventSchema';
import { encodeDeveloperStatusEventAttestation } from './easSchemas/developerStatusEventSchema';
import { attestationLogger } from './logger';

export async function attestDeveloperStatusEvent({
  builderId,
  event
}: {
  builderId: string;
  event: DeveloperStatusEventAttestation;
}): Promise<void> {
  try {
    const developerStatusEventAttestationData = encodeDeveloperStatusEventAttestation(event);

    const userAttestation = await createOrGetUserProfileAttestation({
      scoutId: builderId
    });

    const attestationUid = await attestOnchain({
      schemaId: scoutGameBuilderEventSchemaUid(),
      recipient: NULL_EVM_ADDRESS,
      refUID: userAttestation.id as `0x${string}`,
      data: developerStatusEventAttestationData,
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
    attestationLogger.error('Error attesting developer status event', { error: err, builderId, event });
  }
}
