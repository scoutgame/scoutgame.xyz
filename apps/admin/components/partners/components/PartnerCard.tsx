'use client';

import { AddCircleOutline, Download } from '@mui/icons-material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  Stack,
  Card,
  Button,
  Menu,
  MenuItem,
  Select,
  Typography,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  getLastWeek,
  getWeekStartEndFormatted,
  getDateFromISOWeek,
  getAllISOWeeksFromSeasonStart,
  getCurrentWeek
} from '@packages/dates/utils';
import React, { useState } from 'react';

import { FileDownloadButton } from 'components/common/FileDownloadButton';
import { useFileDownload } from 'hooks/useFileDownload';

import { AddRepoMenuItem } from './AddRepoMenuItem';

const allWeeks = getAllISOWeeksFromSeasonStart();

export function PartnerCard({
  partner,
  partnerName,
  children,
  hasGithubRepos = false
}: {
  partner: string;
  partnerName: string;
  hasGithubRepos?: boolean;
  children?: React.ReactNode;
}) {
  const currentWeek = getCurrentWeek();
  const lastWeek = getLastWeek();
  const [selectedWeek, setSelectedWeek] = useState(lastWeek);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { downloadFile: downloadRepos } = useFileDownload(
    `/api/repos/export?partner=${partner}`,
    `${partnerName} git repos.tsv`
  );
  const { downloadFile: downloadPullRequests } = useFileDownload(
    `/api/github/pull-requests?partner=${partner}`,
    `${partnerName} pull requests.tsv`
  );
  return (
    <Card sx={{ p: 2, display: 'flex' }}>
      <Stack flex={1} gap={2}>
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>{partnerName}</Typography>

          <Stack direction='row' spacing={2}>
            <Button
              size='small'
              onClick={(event) => setAnchorEl(event.currentTarget)}
              endIcon={<KeyboardArrowDownIcon />}
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
            >
              <MenuItem
                onClick={() => {
                  setExportDialogOpen(true);
                  setAnchorEl(null);
                }}
              >
                <ListItemIcon>
                  <Download fontSize='small' />
                </ListItemIcon>
                <ListItemText>Export winners</ListItemText>
              </MenuItem>
              {hasGithubRepos && [
                <Divider key='divider' />,
                <AddRepoMenuItem key='add-repos' partner={partner} onComplete={() => setAnchorEl(null)}>
                  <ListItemIcon>
                    <AddCircleOutline fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Add repos</ListItemText>
                </AddRepoMenuItem>,
                <MenuItem
                  key='export-repos'
                  onClick={() => {
                    downloadRepos(); // dont bother waiting for the file to download
                    setAnchorEl(null);
                  }}
                >
                  <ListItemIcon>
                    <Download fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Export repos</ListItemText>
                </MenuItem>,
                <MenuItem
                  key='export-pull-requests'
                  onClick={() => {
                    downloadPullRequests(); // dont bother waiting for the file to download
                    setAnchorEl(null);
                  }}
                >
                  <ListItemIcon>
                    <Download fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Export pull requests</ListItemText>
                </MenuItem>
              ]}
            </Menu>
          </Stack>

          <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth='xs' fullWidth>
            <DialogTitle>Export Winners</DialogTitle>
            <DialogContent>
              <Stack direction='column' spacing={2} pt={1}>
                <FormControl size='small' fullWidth>
                  <Select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
                    {allWeeks.map((week, index) => (
                      <MenuItem key={week} value={week}>
                        <Stack width='100%' gap={1} direction='row' justifyContent='space-between'>
                          <Typography>{week === currentWeek ? 'Current Week' : `Week ${index + 1}`}</Typography>
                          <Typography color='secondary'>{`${getDateFromISOWeek(week).toFormat('MMM d')}`}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FileDownloadButton
                  variant='contained'
                  fullWidth
                  filename={`${partnerName} Export - Week ${allWeeks.indexOf(selectedWeek) + 1} - ${getWeekStartEndFormatted(getDateFromISOWeek(selectedWeek).toJSDate())}.tsv`}
                  src={`/api/partners/${partner}?week=${selectedWeek}`}
                  // onComplete={() => setExportDialogOpen(false)}
                >
                  Download TSV
                </FileDownloadButton>
              </Stack>
            </DialogContent>
          </Dialog>
        </Stack>
        {children}
      </Stack>
    </Card>
  );
}
