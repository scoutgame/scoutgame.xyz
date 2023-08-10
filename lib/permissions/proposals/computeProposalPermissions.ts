import type { PermissionCompute, ProposalPermissionFlags, ProposalResource } from '@charmverse/core/permissions';
import {
  AvailableProposalPermissions,
  buildComputePermissionsWithPermissionFilteringPolicies,
  getDefaultProposalPermissionPolicies,
  isProposalAuthor,
  proposalResolver
} from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';

import { ProposalNotFoundError } from 'lib/proposal/errors';
import { isProposalReviewer } from 'lib/proposal/isProposalReviewer';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

export async function baseComputeProposalPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<ProposalPermissionFlags> {
  if (!isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid proposal ID: ${resourceId}`);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      status: true,
      categoryId: true,
      spaceId: true,
      createdBy: true,
      authors: true,
      reviewers: true
    }
  });

  if (!proposal) {
    throw new ProposalNotFoundError(`${resourceId}`);
  }
  const { spaceRole, isAdmin } = await hasAccessToSpace({
    spaceId: proposal.spaceId,
    userId,
    disallowGuest: true
  });

  const permissions = new AvailableProposalPermissions();

  if (isAdmin) {
    return { ...permissions.full, make_public: false };
  }

  if (spaceRole) {
    if (isProposalAuthor({ proposal, userId })) {
      permissions.addPermissions(['edit', 'view', 'create_vote', 'delete', 'vote', 'comment', 'archive', 'unarchive']);
    }

    const isReviewer = isProposalReviewer({
      proposal,
      userId
    });

    if (isReviewer) {
      permissions.addPermissions(['view', 'comment', 'review', 'evaluate']);
    }

    // Add default space member permissions
    permissions.addPermissions(['view', 'comment', 'vote']);
  }

  permissions.addPermissions(['view']);

  return permissions.operationFlags;
}

export const computeProposalPermissions = buildComputePermissionsWithPermissionFilteringPolicies<
  ProposalResource,
  ProposalPermissionFlags
>({
  resolver: proposalResolver,
  computeFn: baseComputeProposalPermissions,
  policies: [
    ...getDefaultProposalPermissionPolicies({
      isProposalReviewer
    })
  ]
});
