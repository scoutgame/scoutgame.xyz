'use client';

import { log } from '@charmverse/core/log';
import { Clear as ClearIcon } from '@mui/icons-material';
import {
  Stack,
  Card,
  Grid2 as Grid,
  Container,
  InputAdornment,
  TextField,
  IconButton,
  TableSortLabel,
  MenuItem,
  Select,
  Typography,
  FormControl
} from '@mui/material';
import {
  getLastWeek,
  getWeekStartEndFormatted,
  getDateFromISOWeek,
  getAllISOWeeksFromSeasonStart,
  getCurrentWeek
} from '@packages/dates/utils';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import { bonusPartnersRecord } from '@packages/scoutgame/bonus';
import Image from 'next/image';
import React, { useState, useMemo } from 'react';

import { FileDownloadButton } from 'components/common/FileDownloadButton';

const allWeeks = getAllISOWeeksFromSeasonStart();

export function PartnersDashboard() {
  return (
    <Container maxWidth='lg'>
      <Stack spacing={3} justifyContent='center'>
        <PartnerCard partner='celo' partnerName='Celo' />
        <PartnerCard partner='game7' partnerName='Game7' />
        <PartnerCard partner='octant' partnerName='Octant' />
        <PartnerCard partner='optimism' partnerName='Optimism' />
        <PartnerCard partner='op_supersim' partnerName='OP Supersim' />
        <PartnerCard partner='referrals' partnerName='Referral Rewards' />
        <PartnerCard partner='talent' partnerName='Talent Protocol' />
        <PartnerCard partner='moxie' partnerName='Moxie' />
      </Stack>
    </Container>
  );
}

function PartnerCard({
  partner,
  partnerName,
  children
}: {
  partner: string;
  partnerName: string;
  children?: React.ReactNode;
}) {
  const currentWeek = getCurrentWeek();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  return (
    <Card sx={{ p: 3, display: 'flex' }}>
      <Stack flex={1}>
        <Typography variant='h6'>{partnerName}</Typography>
        {children}
        <Typography variant='body2' color='text.secondary'>
          Total tokens distributed: Loading...
        </Typography>
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
            Export
          </FileDownloadButton>
        </div>
      </Stack>
    </Card>
  );
}
