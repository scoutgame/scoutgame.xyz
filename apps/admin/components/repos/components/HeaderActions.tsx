'use client';

import { Add as AddIcon } from '@mui/icons-material';
import { Button, Dialog, DialogContent, DialogTitle, Stack } from '@mui/material';
import { getDateFromISOWeek, getLastWeek, getWeekStartEndFormatted } from '@packages/dates/utils';
import { useGETtrigger } from '@packages/scoutgame-ui/hooks/helpers';
import { useState } from 'react';

import { FileDownloadButton } from 'components/common/FileDownloadButton';

import { AddRepoButton } from './AddRepoButton/AddRepoButton';

export function HeaderActions() {
  const [open, setOpen] = useState(false);

  function handleClose() {
    setOpen(false);
  }

  // extend the timeout since this takes a while to run
  const { trigger: sendMoxieRewards, isMutating } = useGETtrigger('/api/partners/moxie', { timeout: 240_000 });

  const lastWeek = getWeekStartEndFormatted(getDateFromISOWeek(getLastWeek()).toJSDate());

  return (
    <Stack gap={2} direction='row'>
      <AddRepoButton variant='contained' color='primary' startIcon={<AddIcon />}>
        Add
      </AddRepoButton>
      <Button variant='outlined' onClick={() => setOpen(true)}>
        Export
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Export a list of all repositories</DialogTitle>
        <DialogContent>
          <FileDownloadButton
            fullWidth
            size='small'
            variant='contained'
            filename='github_repos.tsv'
            src='/api/repos/export'
            onComplete={handleClose}
          >
            Download TSV
          </FileDownloadButton>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
