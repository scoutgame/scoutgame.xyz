import type { PageType } from '@charmverse/core/prisma';
import { EditOutlined } from '@mui/icons-material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import { Divider, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMembers } from 'hooks/useMembers';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePostPermissions } from 'hooks/usePostPermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import type { DuplicatePageResponse } from 'lib/pages/duplicatePage';

import { CopyPageLinkAction } from './CopyPageLinkAction';
import { DuplicatePageAction } from './DuplicatePageAction';

export function PageActionsMenu({
  children,
  onClickDelete,
  onClickEdit,
  hideDuplicateAction,
  anchorEl,
  page,
  setAnchorEl,
  readOnly,
  onDuplicate
}: {
  onDuplicate?: (duplicatePageResponse: DuplicatePageResponse) => void;
  onClickDelete?: VoidFunction;
  onClickEdit?: VoidFunction;
  children?: ReactNode;
  hideDuplicateAction?: boolean;
  setAnchorEl: Dispatch<SetStateAction<HTMLElement | null>>;
  anchorEl: HTMLElement | null;
  page: {
    parentId?: string | null;
    createdBy: string;
    type?: PageType;
    id: string;
    updatedAt: Date;
    relativePath?: string;
    path: string;
    deletedAt: Date | null;
  };
  readOnly?: boolean;
}) {
  const { getMemberById } = useMembers();
  const router = useRouter();
  const { showMessage } = useSnackbar();
  const member = getMemberById(page.createdBy);
  const open = Boolean(anchorEl);
  const { formatDateTime } = useDateFormatter();
  const { permissions: pagePermissions } = usePagePermissions({ pageIdOrPath: open ? page.id : null });
  const postPermissions = usePostPermissions({
    postIdOrPath: router.pathname.startsWith('/[domain]/forum') ? page.id : (null as any)
  });
  function getPageLink() {
    let link = window.location.href;

    if (page.relativePath) {
      link = `${window.location.origin}${page.relativePath}`;
    } else {
      link = `${window.location.origin}/${router.query.domain}/${page.path}`;
    }
    return link;
  }

  function onClickOpenInNewTab() {
    window.open(getPageLink());
  }

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleClose();
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      open={open}
    >
      {onClickEdit && !readOnly && (
        <MenuItem dense onClick={onClickEdit}>
          <EditOutlined fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Edit</ListItemText>
        </MenuItem>
      )}
      <MenuItem
        dense
        onClick={onClickDelete}
        disabled={Boolean(readOnly || (!pagePermissions?.delete && !postPermissions?.delete_post))}
        data-test='delete-page-from-context'
      >
        <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />
        <ListItemText>Delete</ListItemText>
      </MenuItem>
      {!hideDuplicateAction && page.type && (
        <DuplicatePageAction
          onComplete={onDuplicate}
          pageId={page.id}
          pageType={page.type}
          pagePermissions={pagePermissions}
        />
      )}
      <CopyPageLinkAction path={getPageLink()} />
      <MenuItem dense onClick={onClickOpenInNewTab}>
        <LaunchIcon fontSize='small' sx={{ mr: 1 }} />
        <ListItemText>Open in new tab</ListItemText>
      </MenuItem>
      {children}
      <Divider />
      {member && (
        <Stack
          sx={{
            px: 2
          }}
        >
          <Typography variant='caption' color='secondary'>
            Last edited by <strong>{member.username}</strong>
          </Typography>
          <Typography variant='caption' color='secondary'>
            at <strong>{formatDateTime(page.updatedAt)}</strong>
          </Typography>
        </Stack>
      )}
    </Menu>
  );
}
