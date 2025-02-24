'use client';

import { log } from '@charmverse/core/log';
import { Clear as ClearIcon } from '@mui/icons-material';
import {
  Stack,
  Card,
  CircularProgress,
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
import { getLastWeek, getWeekStartEndFormatted, getDateFromISOWeek } from '@packages/dates/utils';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import { bonusPartnersRecord } from '@packages/scoutgame/bonus';
import Image from 'next/image';
import React, { useState, useMemo } from 'react';

import { FileDownloadButton } from 'components/common/FileDownloadButton';

export function PartnersDashboard() {
  return (
    <Container maxWidth='md'>
      <Stack spacing={3}>
        <Stack spacing={2}>
          <PartnerCard partner='celo' partnerName='Celo' />
          <PartnerCard partner='game7' partnerName='Game7' />
          <PartnerCard partner='octant' partnerName='Octant' />
          <PartnerCard partner='optimism' partnerName='Optimism' />
          <PartnerCard partner='op_supersim' partnerName='OP Supersim' />
        </Stack>
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
  const lastWeek = getWeekStartEndFormatted(getDateFromISOWeek(getLastWeek()).toJSDate());
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
          <Select value='current' sx={{ minWidth: 120 }}>
            <MenuItem value='current'>Current Week</MenuItem>
            <MenuItem value='last'>Last Week</MenuItem>
            <MenuItem value='custom'>Custom Range</MenuItem>
          </Select>
        </FormControl>
        <div>
          <FileDownloadButton
            variant='contained'
            size='small'
            filename={`${partnerName} Weekly Report.tsv`}
            src={`/api/partners/${partner}`}
          >
            Export
          </FileDownloadButton>
        </div>
      </Stack>
    </Card>
  );
}
