'use client';

import { log } from '@charmverse/core/log';
import { ArrowDropDown as ArrowDropDownIcon, Add as AddIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Divider, Menu, MenuItem, Stack, Button } from '@mui/material';
import { getLastWeek, getWeekStartEndFormatted, getDateFromISOWeek } from '@packages/dates/utils';
import { useGETtrigger } from '@packages/scoutgame-ui/hooks/helpers';
import React, { useState } from 'react';

import { FileDownloadButton } from 'components/common/FileDownloadButton';
import { MenuItemNoAction } from 'components/common/MenuItemNoAction';

import { AddRepoButton } from './AddRepoButton/AddRepoButton';

export function HeaderActions() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  function closeMenu() {
    setAnchorEl(null);
  }
  // extend the timeout since this takes a while to run
  const { trigger: sendMoxieRewards, isMutating } = useGETtrigger('/api/partners/moxie', { timeout: 240_000 });

  const lastWeek = getWeekStartEndFormatted(getDateFromISOWeek(getLastWeek()).toJSDate());
  return (
    <Stack gap={2} direction='row'>
      <AddRepoButton variant='contained' color='primary' startIcon={<AddIcon />}>
        Add
      </AddRepoButton>
      <Button variant='outlined' onClick={(event) => setAnchorEl(event.currentTarget)} endIcon={<ArrowDropDownIcon />}>
        Export
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem>
          <FileDownloadButton
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
            size='small'
            filename={`Celo Weekly Report (${lastWeek}).tsv`}
            src='/api/partners/celo'
          >
            Celo
          </FileDownloadButton>
        </MenuItem>
        <MenuItem>
          <FileDownloadButton
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
            size='small'
            filename={`Game7 Weekly Report (${lastWeek}).tsv`}
            src='/api/partners/game7'
          >
            Game7
          </FileDownloadButton>
        </MenuItem>
        <MenuItem>
          <FileDownloadButton
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
            size='small'
            filename={`Octant Weekly Report (${lastWeek}).tsv`}
            src='/api/partners/octant'
          >
            Octant
          </FileDownloadButton>
        </MenuItem>
        <MenuItem>
          <FileDownloadButton
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
            size='small'
            filename={`Optimism Weekly Report (${lastWeek}).tsv`}
            src='/api/partners/optimism'
          >
            Optimism
          </FileDownloadButton>
        </MenuItem>
        <MenuItem>
          <FileDownloadButton
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
            size='small'
            filename={`OP Supersim Weekly Report (${lastWeek}).tsv`}
            src='/api/partners/op_supersim'
          >
            OP Supersim
          </FileDownloadButton>
        </MenuItem>
        <MenuItem>
          <FileDownloadButton
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
            size='small'
            filename={`Referral Rewards Report (${lastWeek}).tsv`}
            src='/api/partners/referrals'
          >
            Referral Rewards
          </FileDownloadButton>
        </MenuItem>
        <MenuItem>
          <LoadingButton
            loading={isMutating}
            onClick={() => {
              sendMoxieRewards().catch((error) => {
                log.error('Error sending Moxie rewards', error);
                alert(`There was an error sending tokens. Please try again: ${(error as Error).message}`);
              });
            }}
            fullWidth
            size='small'
            sx={{ justifyContent: 'flex-start' }}
          >
            Send Moxie Tokens
          </LoadingButton>
        </MenuItem>
        <MenuItem>
          <FileDownloadButton
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
            size='small'
            filename={`Moxie Weekly Report (${lastWeek}).tsv`}
            src='/api/partners/moxie/export'
            onComplete={closeMenu}
          >
            Export Moxie Report
          </FileDownloadButton>
        </MenuItem>
        <MenuItem>
          <FileDownloadButton
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
            size='small'
            filename={`Talent Protocol Weekly Report (${lastWeek}).tsv`}
            src='/api/partners/talent'
          >
            Talent Protocol
          </FileDownloadButton>
        </MenuItem>
      </Menu>
    </Stack>
  );
}
