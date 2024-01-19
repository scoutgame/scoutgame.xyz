import { ProposalOperation, ProposalSystemRole } from '@charmverse/core/prisma';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { Box, Card, Stack, Tooltip, Typography } from '@mui/material';
import { capitalize } from 'lodash';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import {
  UserAndRoleSelect,
  type SelectOption,
  type SystemRoleOptionPopulated
} from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { MembersIcon, ProposalIcon } from 'components/common/PageIcon';
import { isTruthy } from 'lib/utilities/types';

import { evaluateVerbs, evaluationIcons } from '../constants';

import type { ContextMenuProps } from './EvaluationContextMenu';
import { EvaluationContextMenu } from './EvaluationContextMenu';
import type { EvaluationTemplateFormItem } from './EvaluationDialog';

type SupportedOperation = Extract<ProposalOperation, 'view' | 'comment' | 'edit' | 'move'>;

export const proposalOperations: SupportedOperation[] = ['view', 'comment', 'edit', 'move'];

export const allMembersSystemRole = {
  group: 'system_role',
  icon: (
    <Tooltip title='All members of this space'>
      <MembersIcon color='secondary' fontSize='small' />
    </Tooltip>
  ),
  id: ProposalSystemRole.space_member,
  label: 'All members'
} as const;

const currentReviewerSystemRole = {
  group: 'system_role',
  icon: (
    <Tooltip title='Reviewers selected for this evaluation'>
      <ProposalIcon color='secondary' fontSize='small' />
    </Tooltip>
  ),
  id: ProposalSystemRole.current_reviewer,
  label: 'Reviewers (Current Step)'
} as const;

// a copy of current reviewer, with a different label for vote
const currentVoterSystemRole = {
  ...currentReviewerSystemRole,
  label: 'Voters (Current Step)'
};

export const extraEvaluationRoles: SystemRoleOptionPopulated<ProposalSystemRole>[] = [
  {
    group: 'system_role',
    icon: (
      <Tooltip title='Author'>
        <ProposalIcon color='secondary' fontSize='small' />
      </Tooltip>
    ),
    id: ProposalSystemRole.author,
    label: 'Author'
  },
  currentReviewerSystemRole,
  {
    group: 'system_role',
    icon: (
      <Tooltip title='Reviewers of any step in this workflow'>
        <ProposalIcon color='secondary' fontSize='small' />
      </Tooltip>
    ),
    id: ProposalSystemRole.all_reviewers,
    label: 'All Reviewers'
  },
  allMembersSystemRole
];

const permissionOperationPlaceholders = {
  [ProposalOperation.view]: 'Only admins can view the proposal',
  [ProposalOperation.comment]: 'No one can comment',
  [ProposalOperation.edit]: 'Only admins can edit the proposal',
  [ProposalOperation.move]: 'Only admins can change the current step'
};

export function EvaluationPermissionsRow({
  evaluation,
  onDelete,
  onDuplicate,
  onRename,
  onChange,
  readOnly
}: {
  evaluation: WorkflowEvaluationJson;
  onChange: (evaluation: WorkflowEvaluationJson) => void;
  readOnly: boolean;
} & ContextMenuProps) {
  return (
    <Card variant='outlined' key={evaluation.id} sx={{ mb: 1 }}>
      <Box px={2} py={1}>
        <Box display='flex' alignItems='center' gap={1} mb={1} justifyContent='space-between'>
          {evaluationIcons[evaluation.type]()}
          <Typography variant='h6' sx={{ flexGrow: 1 }}>
            {evaluation.title}
          </Typography>
          <EvaluationContextMenu
            evaluation={evaluation}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onRename={onRename}
            readOnly={readOnly}
          />
        </Box>

        <Stack flex={1} className='CardDetail content'>
          <EvaluationPermissions evaluation={evaluation} onChange={onChange} readOnly={readOnly} />
        </Stack>
      </Box>
    </Card>
  );
}

export function EvaluationPermissions<T extends EvaluationTemplateFormItem | WorkflowEvaluationJson>({
  evaluation,
  onChange,
  readOnly
}: {
  evaluation: T;
  onChange: (evaluation: T) => void;
  readOnly?: boolean;
}) {
  function updatePermissionOperation(operation: ProposalOperation, resources: SelectOption[]) {
    const newPermissions = evaluation.permissions.filter((permission) => permission.operation !== operation);
    resources.forEach((resource) => {
      const permission: WorkflowEvaluationJson['permissions'][number] =
        resource.group === 'system_role'
          ? { operation, systemRole: resource.id as ProposalSystemRole }
          : resource.group === 'role'
          ? { operation, roleId: resource.id }
          : { operation, userId: resource.id };
      newPermissions.push(permission);
    });
    onChange({ ...evaluation, permissions: newPermissions });
  }
  const valuesByOperation = evaluation.permissions.reduce<Partial<Record<ProposalOperation, SelectOption[]>>>(
    (acc, permission) => {
      if (!acc[permission.operation]) {
        acc[permission.operation] = [];
      }
      acc[permission.operation]!.push({
        group: permission.systemRole ? 'system_role' : permission.roleId ? 'role' : 'user',
        id: permission.systemRole ?? permission.roleId ?? permission.userId!
      });
      return acc;
    },
    {}
  );

  const needViewAccess = evaluation.permissions.filter(
    (permission) =>
      permission.operation !== 'view' &&
      !evaluation.permissions.some(
        (p) =>
          p.operation === 'view' &&
          (permission.roleId
            ? p.roleId === permission.roleId
            : permission.systemRole
            ? p.systemRole === permission.systemRole
            : p.userId === permission.userId)
      )
  );
  const idsThatNeedViewAccess = needViewAccess
    .map((permission) => permission.roleId ?? permission.systemRole ?? permission.userId)
    .filter(isTruthy);
  const warningStr = needViewAccess.length ? `Some users or roles are missing View access` : '';

  return (
    <>
      <Typography variant='body2'>Who can:</Typography>

      {proposalOperations.map((operation) => (
        <Box key={operation} className='octo-propertyrow'>
          <PropertyLabel readOnly>{capitalize(operation)}</PropertyLabel>
          <UserAndRoleSelect
            readOnly={readOnly}
            variant='outlined'
            wrapColumn
            // required values cannot be removed
            isRequiredValue={(option) => {
              if (operation === 'view') {
                return option.id === ProposalSystemRole.author || option.id === ProposalSystemRole.current_reviewer;
              }
              return false;
            }}
            errorValues={operation !== 'view' ? idsThatNeedViewAccess : []}
            value={valuesByOperation[operation] || []}
            systemRoles={extraEvaluationRoles}
            inputPlaceholder={permissionOperationPlaceholders[operation]}
            onChange={async (options) => updatePermissionOperation(operation, options)}
          />
        </Box>
      ))}

      {/* show evaluation action which is uneditable */}
      <Box className='octo-propertyrow' display='flex' alignItems='center !important'>
        <PropertyLabel readOnly>{evaluateVerbs[evaluation.type]}</PropertyLabel>
        {evaluation.type === 'feedback' ? (
          <Typography color='secondary' variant='caption'>
            There is no review step for Feedback
          </Typography>
        ) : (
          <UserAndRoleSelect
            readOnly
            wrapColumn
            value={[{ group: 'system_role', id: ProposalSystemRole.current_reviewer }]}
            systemRoles={evaluation.type === 'vote' ? [currentVoterSystemRole] : [currentReviewerSystemRole]}
            onChange={() => {}}
          />
        )}
      </Box>
      {warningStr && (
        <Box className='octo-propertyrow'>
          <PropertyLabel readOnly></PropertyLabel>
          <Typography color='error' variant='caption'>
            {warningStr}
          </Typography>
        </Box>
      )}
    </>
  );
}
