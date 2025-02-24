'use client';

import { Stack, Card, MenuItem, Select, Typography, FormControl } from '@mui/material';
import {
  getLastWeek,
  getWeekStartEndFormatted,
  getDateFromISOWeek,
  getAllISOWeeksFromSeasonStart,
  getCurrentWeek
} from '@packages/dates/utils';
import React, { useState } from 'react';

import { FileDownloadButton } from 'components/common/FileDownloadButton';

const allWeeks = getAllISOWeeksFromSeasonStart();

export function PartnerCard({
  partner,
  partnerName,
  children
}: {
  partner: string;
  partnerName: string;
  children?: React.ReactNode;
}) {
  const currentWeek = getCurrentWeek();
  const lastWeek = getLastWeek();
  const [selectedWeek, setSelectedWeek] = useState(lastWeek);

  return (
    <Card sx={{ p: 3, display: 'flex' }}>
      <Stack flex={1}>
        <Typography variant='h5'>{partnerName}</Typography>
        {children}
      </Stack>

      <Stack direction='row' spacing={2}>
        <FormControl size='small'>
          <Select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} sx={{ minWidth: 120 }}>
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
        <div>
          <FileDownloadButton
            variant='contained'
            size='small'
            filename={`${partnerName} Export - Week ${allWeeks.indexOf(selectedWeek) + 1} - ${getWeekStartEndFormatted(getDateFromISOWeek(selectedWeek).toJSDate())}.tsv`}
            src={`/api/partners/${partner}?week=${selectedWeek}`}
          >
            Export winners
          </FileDownloadButton>
        </div>
      </Stack>
    </Card>
  );
}
