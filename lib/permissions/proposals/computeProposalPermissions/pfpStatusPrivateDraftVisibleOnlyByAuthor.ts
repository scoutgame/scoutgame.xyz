import type { ProposalOperation } from '@prisma/client';

import { typedKeys } from 'lib/utilities/objects';

import { AvailableProposalPermissions } from '../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../interfaces';

import type { ProposalPfpInput } from './interfaces';
import { isProposalAuthor } from './isProposalAuthor';

export async function pfpStatusPrivateDraftVisibleOnlyByAuthor({
  resource,
  flags,
  userId,
  isAdmin
}: ProposalPfpInput): Promise<AvailableProposalPermissionFlags> {
  const newPermissions = { ...flags };

  if (resource.status !== 'private_draft') {
    return newPermissions;
  }

  const allowedOperations: ProposalOperation[] = ['view', 'edit', 'delete', 'comment'];
  if (isProposalAuthor({ proposal: resource, userId }) || isAdmin) {
    typedKeys(flags).forEach((flag) => {
      if (!allowedOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
    return newPermissions;
  }

  return new AvailableProposalPermissions().empty;
}
