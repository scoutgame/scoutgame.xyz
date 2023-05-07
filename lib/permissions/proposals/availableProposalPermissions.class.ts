import type { ProposalOperation } from '@charmverse/core/prisma';

import { BasePermissions } from '../basePermissions.class';

import { proposalOperations } from './interfaces';

export class AvailableProposalPermissions extends BasePermissions<ProposalOperation> {
  constructor() {
    super({ allowedOperations: proposalOperations.slice() });
  }
}
