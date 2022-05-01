import { Box, IconButton, List, ListItem, ListItemText, Tooltip, Typography } from '@mui/material';
import { usePages } from 'hooks/usePages';
import { Modal, DialogTitle } from 'components/common/Modal';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { Page, PageContent } from 'models';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import charmClient from 'charmClient';
import { mutate } from 'swr';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useState } from 'react';
import { DateTime } from 'luxon';
import PageIcon from './PageIcon';

export default function TrashModal ({ onClose, isOpen }: {onClose: () => void, isOpen: boolean}) {
  const { deletedPages, getPagePermissions } = usePages();
  const [space] = useCurrentSpace();
  const [isMutating, setIsMutating] = useState(false);

  async function deletePage (pageId: string) {
    setIsMutating(true);
    await charmClient.deletePage(pageId);
    await mutate(`pages/deleted/${space?.id}`);
    setIsMutating(false);
  }

  async function restorePages (pageId: string) {
    setIsMutating(true);
    await charmClient.restorePage(pageId);
    await mutate(`pages/${space?.id}`);
    await mutate(`pages/deleted/${space?.id}`);
    setIsMutating(false);
  }

  // Remove the pages you dont have delete access of
  const deletedPagesWithPermission = (Object
    .values(deletedPages)
    .filter(deletedPage => deletedPage && getPagePermissions(deletedPage.id).delete) as Page[])
    .sort((deletedPageA, deletedPageB) => deletedPageA.deletedAt && deletedPageB.deletedAt
      ? new Date(deletedPageA.deletedAt).getTime() - new Date(deletedPageB.deletedAt).getTime()
      : 0);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
    >
      <div>
        <DialogTitle>Trash</DialogTitle>
        {deletedPagesWithPermission.length === 0 ? <Typography variant='subtitle1' color='secondary'>No archived pages</Typography> : (
          <List>
            {deletedPagesWithPermission.map(deletedPage => {
              const isEditorEmpty = checkForEmpty(deletedPage.content as PageContent);
              return (
                <ListItem disableGutters disabled={isMutating} key={deletedPage.id}>
                  <Box mr={1}>
                    <PageIcon pageType={deletedPage.type} icon={deletedPage.icon} isEditorEmpty={isEditorEmpty} />
                  </Box>
                  <ListItemText secondary={DateTime.fromJSDate(new Date(deletedPage.deletedAt!)).toRelative({ base: (DateTime.now()) })}>{deletedPage.title || 'Untitled'}</ListItemText>
                  <div>
                    <IconButton disabled={isMutating} size='small' onClick={() => restorePages(deletedPage.id)}>
                      <Tooltip arrow placement='top' title='Restore page'>
                        <RestoreIcon color='info' fontSize='small' />
                      </Tooltip>
                    </IconButton>
                    <IconButton disabled={isMutating} size='small' onClick={() => deletePage(deletedPage.id)}>
                      <Tooltip arrow placement='top' title='Delete page permanently'>
                        <DeleteIcon color='error' fontSize='small' />
                      </Tooltip>
                    </IconButton>
                  </div>
                </ListItem>
              );
            })}
          </List>
        )}
      </div>
    </Modal>
  );
}
