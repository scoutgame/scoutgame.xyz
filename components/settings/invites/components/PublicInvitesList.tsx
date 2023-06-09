import type { PublicInviteLinkContext } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import ButtonChip from 'components/common/ButtonChip';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import TableRow from 'components/common/Table/TableRow';
import TokenGateRolesSelect from 'components/settings/invites/components/TokenGates/components/TokenGateRolesSelect';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';
import type { InviteLinkWithRoles } from 'lib/invites/getSpaceInviteLinks';
import type { BrandColor } from 'theme/colors';

import { TogglePublicProposalsInvite } from './TogglePublicProposalsInvite';

const colorMapping: Record<PublicInviteLinkContext, BrandColor> = {
  proposals: 'purple'
};

const labels: Record<PublicInviteLinkContext, string> = {
  proposals: 'Proposals'
};

type InviteRowProps = {
  invite: InviteLinkWithRoles & { publicContext: PublicInviteLinkContext };
  isAdmin: boolean;
  updateInviteLinkRoles: (args: { inviteLinkId: string; roleIds: string[] }) => void;
  deleteInviteLink: (id: string) => void;
};

function InviteRow({ invite, isAdmin, updateInviteLinkRoles, deleteInviteLink }: InviteRowProps) {
  const [copied, setCopied] = useState(false);

  function onCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  const {
    isOpen,
    close: closeDeleteConfirmation,
    open: openDeleteConfirmation
  } = usePopupState({ variant: 'popover', popupId: 'delete-invite' });

  function removeInvite() {
    if (invite.roleIds.length > 0) {
      openDeleteConfirmation();
    } else {
      deleteInviteLink(invite.id);
    }
  }

  return (
    <>
      <TableRow key={invite.id}>
        <TableCell sx={{ padding: '20px 16px' }}>
          <Box display='flex' justifyContent='flex-start' gap={1}>
            {invite.publicContext === 'proposals' ? 'Public proposals' : 'Private'} Link
            {invite.publicContext === 'proposals' && (
              <Tooltip title='Anyone can join your space from the public proposals page'>
                <InfoOutlinedIcon color='secondary' fontSize='small' />
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Typography>
            <Chip label={labels[invite.publicContext]} color={colorMapping[invite.publicContext]} />
          </Typography>
        </TableCell>
        <TableCell width={150}>
          <TokenGateRolesSelect
            isAdmin={isAdmin}
            selectedRoleIds={invite.roleIds}
            onChange={(roleIds) => {
              updateInviteLinkRoles({ inviteLinkId: invite.id, roleIds });
            }}
            onDelete={(roleId) => {
              updateInviteLinkRoles({
                inviteLinkId: invite.id,
                roleIds: invite.roleIds.filter((role) => role !== roleId)
              });
            }}
          />
        </TableCell>
        <TableCell width={90}>
          <Tooltip arrow placement='top' title={copied ? 'Copied!' : 'Click to copy link'} disableInteractive>
            <Box component='span'>
              <CopyToClipboard text={getInviteLink(invite.code)} onCopy={onCopy}>
                <Chip
                  sx={{ width: 90 }}
                  clickable
                  color='secondary'
                  size='small'
                  variant='outlined'
                  label={copied ? 'Copied!' : 'Copy Link'}
                />
              </CopyToClipboard>
            </Box>
          </Tooltip>
        </TableCell>
        <TableCell width={30}>
          {isAdmin && (
            <Tooltip arrow placement='top' title='Delete'>
              <ButtonChip
                className='row-actions'
                icon={<CloseIcon />}
                clickable
                color='secondary'
                size='small'
                variant='outlined'
                onClick={removeInvite}
              />
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      <ConfirmDeleteModal
        title='Confirm delete'
        question={`This invite link has ${invite?.roleIds.length} ${stringUtils.conditionalPlural({
          word: 'role',
          count: invite?.roleIds.length ?? 0
        })} attached. Are you sure you want to delete it?`}
        open={isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={() => deleteInviteLink(invite?.id as string)}
        buttonText='Delete invite'
      />
    </>
  );
}

export function PublicInvitesList() {
  const isAdmin = useIsAdmin();
  const { updateInviteLinkRoles, deleteInviteLink, publicInvites } = useSpaceInvitesList();

  const publicProposalsInvite = publicInvites.find((invite) => invite.publicContext === 'proposals');

  const padding = 32;

  return (
    <Box overflow='auto'>
      <Table size='small' aria-label='Invite links table'>
        <TableHead>
          <TableRow sx={{ '&:first-of-type th': { borderTop: '1px solid lightgray' } }}>
            <TableCell sx={{ padding: '10px 16px' }}>Description</TableCell>
            <TableCell>Public page</TableCell>
            <TableCell sx={{ width: 150 }}>Assigned Role</TableCell>
            <TableCell sx={{ width: 90 + padding }} align='center'>
              Link
            </TableCell>
            <TableCell sx={{ width: 30 + padding }}>{/** Delete */}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {publicProposalsInvite && (
            <InviteRow
              invite={publicProposalsInvite as InviteLinkWithRoles & { publicContext: PublicInviteLinkContext }}
              deleteInviteLink={deleteInviteLink}
              isAdmin={isAdmin}
              updateInviteLinkRoles={updateInviteLinkRoles}
            />
          )}
        </TableBody>
      </Table>

      {!publicProposalsInvite && <TogglePublicProposalsInvite />}
    </Box>
  );
}

function getInviteLink(code: string) {
  return `${window.location.origin}/invite/${code}`;
}
