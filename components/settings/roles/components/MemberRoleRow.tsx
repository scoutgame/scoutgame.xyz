import { Divider } from '@mui/material';

import { useMembers } from 'hooks/useMembers';

import DefaultPagePermissions from './RolePermissions/components/DefaultPagePermissions';
import { RolePermissions } from './RolePermissions/RolePermissions';
import { RoleRowBase } from './RoleRowBase';

export function MemberRoleRow({ readOnly, spaceId }: { readOnly: boolean; spaceId: string }) {
  const { members, removeGuest } = useMembers();

  return (
    <RoleRowBase
      title='Member'
      description={
        <>
          Users are added to the Member Role by default
          <br />
          Admins can change the default permissions for the Member Role
        </>
      }
      readOnlyMembers={readOnly}
      members={members.filter((member) => !member.isAdmin && !member.isGuest)}
      removeMember={removeGuest}
      permissions={
        <>
          <DefaultPagePermissions />
          <Divider sx={{ my: 2 }} />
          <RolePermissions targetGroup='space' id={spaceId} />
        </>
      }
    />
  );
}
