import { DataNotFoundError } from '@charmverse/core/errors';
import type { OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';

import { fetchProject } from '../projects/fetchProject';

import { createProjectViaAgora, storeProjectMetadataViaAgora } from './agoraApi';
import { mapProjectToOptimism } from './mapProjectToOptimism';

// Format for metadata.json:
// attestations/{schemaId}/project-{charmverse_uid}/metadata.json

export async function storeProjectMetadataAndPublishOptimismAttestation({
  userId,
  projectId,
  tx = prisma
}: {
  userId: string;
  projectId: string;
} & OptionalPrismaTransaction): Promise<{ projectRefUID: string; attestationMetadataUID: string }> {
  const farcasterUser = await tx.farcasterUser.findUniqueOrThrow({
    where: {
      userId
    },
    select: {
      account: true,
      fid: true
    }
  });

  const project = await fetchProject({ id: projectId });

  if (!project) {
    throw new DataNotFoundError('Project not found');
  }

  const fcProfile = await getFarcasterProfile({
    fid: farcasterUser.fid
  });

  if (!fcProfile) {
    throw new DataNotFoundError('Farcaster profile not found');
  }

  const mappedProject = mapProjectToOptimism(project);

  const { attestationId: projectRefUID } = await createProjectViaAgora({
    farcasterId: farcasterUser.fid
  });
  const { attestationId: attestationMetadataUID } = await storeProjectMetadataViaAgora({
    farcasterId: farcasterUser.fid,
    projectRefUID,
    projectId
  });

  return { projectRefUID, attestationMetadataUID };
}
