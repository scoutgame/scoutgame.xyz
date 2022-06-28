import { BountyPermissionLevel, BountyOperation } from '@prisma/client';
import { OperationGroupMapping } from '../interfaces';

export function bountyPermissionLevels () {
  return Object.keys(BountyPermissionLevel) as BountyPermissionLevel[];
}

class BountyPermissionLevelOperationMapping implements OperationGroupMapping<BountyPermissionLevel, BountyOperation> {

  readonly creator: Readonly<BountyOperation[]>;

  readonly reviewer: Readonly<BountyOperation[]>;

  readonly submitter: Readonly<BountyOperation[]>;

  readonly viewer: Readonly<BountyOperation[]>;

  constructor () {
    this.creator = ['view', 'edit', 'delete', 'lock', 'approve_applications', 'grant_permissions'];
    this.reviewer = ['review', 'view', 'approve_applications'];
    this.submitter = ['view', 'work'];
    this.viewer = ['view'];
  }
}

export const bountyPermissionMapping = new BountyPermissionLevelOperationMapping();

export function getGroupsWithOperations (operations: BountyOperation[]): BountyPermissionLevel[] {
  return bountyPermissionLevels().filter(level => {

    for (const op of operations) {
      if (!bountyPermissionMapping[level].includes(op)) {
        return false;
      }
    }

    return true;

  });
}
