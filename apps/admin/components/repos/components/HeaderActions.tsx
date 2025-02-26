'use client';

import { log } from '@charmverse/core/log';
import { Add as AddIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Dialog, DialogTitle, DialogContent, Stack, Button } from '@mui/material';
import { getLastWeek, getWeekStartEndFormatted, getDateFromISOWeek } from '@packages/dates/utils';
import { useGETtrigger } from '@packages/scoutgame-ui/hooks/helpers';
import React, { useState } from 'react';

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
            filename='github_repos.tsv'
            src='/api/repos/export'
            onComplete={handleClose}
          >
            Download as TSV
          </FileDownloadButton>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
