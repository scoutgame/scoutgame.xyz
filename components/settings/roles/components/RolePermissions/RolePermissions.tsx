import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import type { SpaceOperation } from '@prisma/client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { BooleanSchema } from 'yup';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Loader from 'components/common/Loader';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import type { AssignablePermissionGroups } from 'lib/permissions/interfaces';
import type { SpacePermissionFlags } from 'lib/permissions/spaces/client';
import { AvailableSpacePermissions } from 'lib/permissions/spaces/client';
import { typedKeys } from 'lib/utilities/objects';

const spaceOperationLabels: Record<Exclude<SpaceOperation, 'createVote'>, string> = {
  createPage: 'Create new pages',
  createBounty: 'Create new bounties',
  createForumCategory: 'Create new forum categories',
  moderateForums: 'Moderate all forum categories',
  reviewProposals: 'Review proposals'
};

// We don't want to have explicit support for forum categories in space permissions config yet
const spaceOperationsWithoutForumCategory = typedKeys(spaceOperationLabels).filter(
  (key) => key !== 'createForumCategory'
);

const fields: Record<SpaceOperation, BooleanSchema> = spaceOperationsWithoutForumCategory.reduce(
  (_schema: Record<SpaceOperation, BooleanSchema>, op) => {
    _schema[op] = yup.boolean();
    return _schema;
  },
  {} as any
);

export const schema = yup.object(fields);

type FormValues = yup.InferType<typeof schema>;

/**
 * @param callback Used to tell the parent the operation is complete. Useful for triggering refreshes
 */
interface Props {
  targetGroup: AssignablePermissionGroups;
  id: string;
  callback?: () => void;
}

export function RolePermissions({ targetGroup, id, callback = () => null }: Props) {
  const [assignedPermissions, setAssignedPermissions] = useState<SpacePermissionFlags | null>(null);

  const space = useCurrentSpace();

  const isAdmin = useIsAdmin();
  // custom onChange is used for switches so isDirty from useForm doesn't change it value
  const [touched, setTouched] = useState<boolean>(false);
  const { handleSubmit, setValue, watch } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: assignedPermissions ?? new AvailableSpacePermissions().empty,
    resolver: yupResolver(schema)
  });

  usePreventReload(touched);

  const newValues = watch();

  useEffect(() => {
    if (space) {
      refreshGroupPermissions();
    }
  }, [space]);

  async function refreshGroupPermissions() {
    const permissionFlags = await charmClient.queryGroupSpacePermissions({
      group: targetGroup,
      id,
      resourceId: space?.id as string
    });
    spaceOperationsWithoutForumCategory.forEach((op) => {
      setValue(op, permissionFlags[op]);
    });
    setAssignedPermissions(permissionFlags);
  }
  const settingsChanged =
    assignedPermissions !== null &&
    (Object.entries(assignedPermissions) as [SpaceOperation, boolean][]).some(([operation, hasAccess]) => {
      const newValue = newValues[operation];
      return newValue !== hasAccess;
    });

  // We don't want to show the forum category moderate permission in context of the entire space
  const assignableOperations =
    targetGroup === 'space'
      ? spaceOperationsWithoutForumCategory.filter((op) => op !== 'moderateForums')
      : spaceOperationsWithoutForumCategory;

  async function submitted(formValues: FormValues) {
    // Make sure we have existing permission set to compare against
    if (assignedPermissions && space) {
      const permissionsToAdd: SpaceOperation[] = [];
      const permissionsToRemove: SpaceOperation[] = [];

      // Only get new values
      (Object.entries(formValues) as [SpaceOperation, boolean][]).forEach(([operation, hasAccess]) => {
        if (assignedPermissions[operation] !== hasAccess) {
          if (hasAccess === true) {
            permissionsToAdd.push(operation);
          } else if (hasAccess === false) {
            permissionsToRemove.push(operation);
          }
        }
      });

      let newPermissionState = assignedPermissions;

      if (permissionsToAdd.length > 0) {
        newPermissionState = await charmClient.addSpacePermissions({
          forSpaceId: space.id,
          operations: permissionsToAdd,
          spaceId: targetGroup === 'space' ? id : undefined,
          roleId: targetGroup === 'role' ? id : undefined,
          userId: targetGroup === 'user' ? id : undefined
        });
      }

      if (permissionsToRemove.length > 0) {
        newPermissionState = await charmClient.removeSpacePermissions({
          forSpaceId: space.id,
          operations: permissionsToRemove,
          spaceId: targetGroup === 'space' ? id : undefined,
          roleId: targetGroup === 'role' ? id : undefined,
          userId: targetGroup === 'user' ? id : undefined
        });
      }
      // Force a refresh of rendered components
      setAssignedPermissions(newPermissionState);
      callback();
      setTouched(false);
    }
  }

  if (!assignedPermissions) {
    return (
      <Box sx={{ height: 100 }}>
        <Loader size={20} sx={{ height: 600 }} />
      </Box>
    );
  }

  return (
    <div data-test={`space-permissions-form-${targetGroup}`}>
      <form onSubmit={handleSubmit((formValue) => submitted(formValue))} style={{ margin: 'auto' }}>
        <Grid container gap={2}>
          <Grid item xs={8}>
            {assignableOperations.map((operation) => {
              const userCanPerformAction = assignedPermissions[operation];
              const actionLabel = spaceOperationLabels[operation];

              return (
                <FormControlLabel
                  key={operation}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    margin: 0,
                    borderBottom: '1px solid var(--input-border)'
                  }}
                  control={
                    <Switch
                      data-test={`space-operation-${targetGroup}-${operation}`}
                      disabled={!isAdmin}
                      defaultChecked={userCanPerformAction}
                      onChange={(ev) => {
                        const { checked: nowHasAccess } = ev.target;
                        setValue(operation, nowHasAccess);
                        setTouched(true);
                      }}
                    />
                  }
                  label={actionLabel}
                  labelPlacement='start'
                />
              );
            })}

            {isAdmin && (
              <Box mt={2}>
                <Button
                  size='small'
                  data-test='submit-space-permission-settings'
                  disabled={!settingsChanged}
                  type='submit'
                  variant='contained'
                  color='primary'
                >
                  Save
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
