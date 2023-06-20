import Grid from '@mui/material/Grid';

import { UpgradeWrapper, upgradeMessages } from 'components/settings/subscription/UpgradeWrapper';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { AddRolesRow } from '../common/AddRolesRow';
import { PostCategoryRolePermissionRow } from '../common/PostCategoryPermissionRow';

/**
 * @permissions The actions a user can perform on a post category
 *
 * @abstract All other permissions inside this component are the actual assigned list of permissions to various groups for this post category
 */
type Props = {
  postCategoryId: string;
};

export function FreePostCategoryPermissions({ postCategoryId }: Props) {
  const { space } = useCurrentSpace();

  return (
    <Grid container>
      <Grid item xs={12}>
        <PostCategoryRolePermissionRow
          canEdit={false}
          deletePermission={() => null}
          updatePermission={() => null}
          postCategoryId={postCategoryId}
          defaultPermissionLevel='full_access'
          assignee={{ group: 'space', id: space?.id as string }}
          disabledTooltip={upgradeMessages.forumPermissions}
        />
      </Grid>

      <Grid item xs={12}>
        <UpgradeWrapper upgradeContext='customRoles'>
          <AddRolesRow disabled />
        </UpgradeWrapper>
      </Grid>
    </Grid>
  );
}
