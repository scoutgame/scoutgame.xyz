import type {
  ProposalPermissionFlags,
  ProposalCategoryWithPermissions,
  ProposalFlowPermissionFlags
} from '@charmverse/core/permissions';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { ListSpaceRolesResponse } from '../../pages/api/roles/index';
import { generateDefaultProposalCategoriesInput } from '../../lib/proposal/generateDefaultProposalCategoriesInput';
import { createMockUser } from '../../testing/mocks/user';
import { createMockSpace } from '../../testing/mocks/space';
import { createMockSpaceMember } from '../../testing/mocks/spaceMember';
import type { Member } from '../../lib/members/interfaces';

export const userProfile = createMockUser();
export const spaces = [createMockSpace()];
export const members: Member[] = [
  createMockSpaceMember(),
  createMockSpaceMember(),
  createMockSpaceMember(),
  createMockSpaceMember(),
  createMockSpaceMember()
];
export const spaceRoles: ListSpaceRolesResponse[] = [
  { id: '1', name: 'Moderator', spacePermissions: [], source: null },
  { id: '1', name: 'Grant Reviewer', spacePermissions: [], source: null }
];
export const proposalCategories: ProposalCategoryWithPermissions[] = generateDefaultProposalCategoriesInput(
  'space-id'
).map((cat) => ({
  ...cat
}));

export const proposalTemplates: ProposalWithUsers[] = [];
