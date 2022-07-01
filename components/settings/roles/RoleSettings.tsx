
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { CircularProgress, Menu, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { SpacePermissionConfigurationMode } from '@prisma/client';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import Legend from 'components/settings/Legend';
import ImportGuildRolesMenuItem from 'components/settings/roles/components/ImportGuildRolesMenuItem';
import useRoles from 'hooks/useRoles';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useRef, useState } from 'react';
import InviteLinkList from 'components/settings/contributors/InviteLinks/InviteLinks';
import ImportDiscordRolesMenuItem from './components/ImportDiscordRolesMenuItem';
import RoleForm from './components/RoleForm';
import RoleRow from './components/RoleRow';
import { useImportDiscordRoles } from './hooks/useImportDiscordRoles';
import DefaultPagePermissions from './components/SpacePermissions/components/DefaultPagePermissions';
import PermissionConfigurationMode from './components/SpacePermissions/components/PermissionConfigurationMode';
import SpacePermissions from './components/SpacePermissions';
import TokenGates from './components/TokenGates';

export default function RoleSettings () {
  const {
    assignRoles,
    deleteRole,
    refreshRoles,
    unassignRole,
    roles
  } = useRoles();
  const isAdmin = useIsAdmin();
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-role' });
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [space] = useCurrentSpace();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { isValidating } = useImportDiscordRoles();

  const [selectedPermissionMode, setSelectedPermissionMode] = useState<SpacePermissionConfigurationMode>(space?.permissionConfigurationMode ?? 'custom');

  return (
    <>
      {/* Space permissions */}
      <Legend sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Permissions
      </Legend>

      <PermissionConfigurationMode permissionModeSelected={setSelectedPermissionMode} />

      {
        space?.permissionConfigurationMode === 'custom' && selectedPermissionMode === 'custom' && (
          <>
            <br />
            <SpacePermissions targetGroup='space' id={space?.id as string} />

            <br />
            {/* Default page permissions */}
            <DefaultPagePermissions />
          </>
        )
      }

      {/* Roles */}
      <Legend sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Roles
        {isAdmin && (
          <Box component='span' display='flex' gap={1}>
            <Button
              onClick={() => {
                setAnchorEl(buttonRef?.current);
              }}
              ref={buttonRef}
              variant='outlined'
              endIcon={(
                <KeyboardArrowDownIcon />
              )}
              disabled={isValidating}
            >
              Import roles
            </Button>
            <Button {...bindTrigger(popupState)} disabled={isValidating}>Add a role</Button>
          </Box>
        )}
      </Legend>
      {isValidating ? (
        <Box display='flex' alignItems='center' gap={1}>
          <CircularProgress size={24} />
          <Typography variant='subtitle1' color='secondary'>Importing roles from discord server</Typography>
        </Box>
      ) : roles?.map(role => (
        <RoleRow
          isEditable={isAdmin}
          assignRoles={assignRoles}
          unassignRole={unassignRole}
          deleteRole={deleteRole}
          refreshRoles={refreshRoles}
          role={role}
          key={role.id}
        />
      ))}

      {/* Token gates section */}
      <TokenGates isAdmin={isAdmin} spaceId={space?.id as string} />

      <InviteLinkList isAdmin={isAdmin} spaceId={space?.id as string} />

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <ImportDiscordRolesMenuItem />
        <ImportGuildRolesMenuItem onClose={handleClose} />
      </Menu>
      <Modal {...bindPopover(popupState)} title='Add a role'>
        <RoleForm
          mode='create'
          submitted={() => {
            popupState.close();
            refreshRoles();
          }}
        />
      </Modal>
    </>
  );
}
