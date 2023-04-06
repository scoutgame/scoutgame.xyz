import { BountyOperation } from '@prisma/client';

import { BasePermissions } from '../basePermissions.class';

export class AvailableBountyPermissions extends BasePermissions<BountyOperation> {
  constructor(operations: BountyOperation[] = []) {
    super({ allowedOperations: Object.keys(BountyOperation) as BountyOperation[] });

    this.addPermissions(operations);
  }
}
