import { Box, Chip, InputLabel, MenuItem, Select } from '@mui/material';
import type { ProposalStatus } from '@prisma/client';

import { ViewOptions } from 'components/common/ViewOptions';
import type { ProposalCategoryWithPermissions } from 'lib/permissions/proposals/interfaces';
import type { ProposalCategory } from 'lib/proposal/interface';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import type { BrandColor } from 'theme/colors';

import { CategoryContextMenu } from './ProposalCategoryContextMenu';

export type ProposalSort = 'latest_created';
export type ProposalFilter = ProposalStatus | 'all';

type Props = {
  proposalFilter: ProposalFilter;
  setProposalFilter: (proposalFilter: ProposalFilter) => void;
  proposalSort: ProposalSort;
  setProposalSort: (proposalSort: ProposalSort) => void;
  categoryIdFilter: string | null;
  setCategoryIdFilter: (val: string) => void;
  categories: ProposalCategoryWithPermissions[];
};

export function ProposalsViewOptions({
  proposalSort,
  setProposalSort,
  proposalFilter,
  setProposalFilter,
  categories,
  categoryIdFilter,
  setCategoryIdFilter
}: Props) {
  return (
    <>
      <ViewOptions label='Sort'>
        <Select
          variant='outlined'
          value={proposalSort}
          onChange={(e) => setProposalSort(e.target.value as ProposalSort)}
          sx={{ mr: 2 }}
        >
          <MenuItem value='latest_created'>Created</MenuItem>
        </Select>
      </ViewOptions>

      <ViewOptions label='Filter'>
        <Box display='flex' gap={1}>
          <Select
            variant='outlined'
            value={proposalFilter}
            onChange={(e) => setProposalFilter(e.target.value as ProposalFilter)}
          >
            {Object.entries(PROPOSAL_STATUS_LABELS).map(([proposalStatus, proposalStatusLabel]) => (
              <MenuItem key={proposalStatus} value={proposalStatus}>
                {proposalStatusLabel}
              </MenuItem>
            ))}
            <MenuItem value='all'>All</MenuItem>
          </Select>

          <Select
            variant='outlined'
            value={categoryIdFilter || ''}
            onChange={(e) => setCategoryIdFilter(e.target.value)}
          >
            <MenuItem value='all'>All categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                <Chip sx={{ cursor: 'pointer' }} color={category.color as BrandColor} label={category.title} />
                <CategoryContextMenu category={category} key={category.id} />
              </MenuItem>
            ))}
          </Select>
        </Box>
      </ViewOptions>
    </>
  );
}
