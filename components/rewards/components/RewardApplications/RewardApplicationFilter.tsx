import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import { MenuItem, Stack, Typography } from '@mui/material';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { ViewOptions } from 'components/common/ViewOptions';
import type { BrandColor } from 'theme/colors';

import {
  REWARD_APPLICATION_STATUS_COLORS,
  REWARD_APPLICATION_STATUS_LABELS,
  RewardApplicationStatusChip
} from '../RewardApplicationStatusChip';

export type ApplicationFilterStatus = 'all' | ApplicationStatus;

const statusLabels: Record<ApplicationFilterStatus, string> = {
  all: 'All statuses',
  ...REWARD_APPLICATION_STATUS_LABELS
};

const statusColors: Record<ApplicationFilterStatus, BrandColor> = {
  all: 'gray',
  ...REWARD_APPLICATION_STATUS_COLORS
};

const options = Object.entries(statusLabels).map(
  ([status, label]) =>
    ({ color: statusColors[status as ApplicationFilterStatus], id: status, name: label } as SelectOptionType)
);

type FilterOptionProps = {
  status?: ApplicationFilterStatus;
  onStatusSelect: (newStatus: ApplicationFilterStatus) => void;
};

function FilterOption({ status }: { status: ApplicationFilterStatus }) {
  if (status === 'all') {
    return <Chip label={statusLabels.all} sx={{ fontWeight: 'bold' }} size='small' />;
  }
  return <RewardApplicationStatusChip status={status} size='small' />;
}

export function RewardApplicationFilter({ onStatusSelect, status = 'all' }: FilterOptionProps) {
  return (
    <Stack direction='row' spacing={1} alignItems='center'>
      <ViewOptions label='Filter'>
        <Select
          sx={{ height: '32px' }}
          value={status}
          variant='outlined'
          renderValue={(value) => {
            return <FilterOption status={value as ApplicationFilterStatus} />;
          }}
          onChange={(ev) => {
            const newValue = ev.target.value;
            if (newValue && statusLabels[newValue as ApplicationFilterStatus]) {
              onStatusSelect(newValue as ApplicationFilterStatus);
            }
          }}
        >
          {options.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              <FilterOption status={opt.id as ApplicationFilterStatus} />
            </MenuItem>
          ))}
        </Select>
      </ViewOptions>
    </Stack>
  );
}
