'use client';

import { Clear as ClearIcon } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Skeleton,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import type { Repo } from '@packages/scoutgame/repos/getRepos';
import { useState } from 'react';

import { useSearchRepos } from '../../../../hooks/api/repos';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';

export function SearchRepos({ popularRepos }: { popularRepos: Repo[] }) {
  const [filterString, setFilter] = useState('');
  const debouncedFilterString = useDebouncedValue(filterString);
  const { data: filteredRepos, isValidating, isLoading } = useSearchRepos(debouncedFilterString);

  return (
    <>
      <Typography variant='h6' color='secondary'>
        {!filteredRepos && !filterString ? 'Popular' : 'Results'}
      </Typography>
      <TextField
        label='Search'
        placeholder='Filter by name'
        variant='outlined'
        value={filterString}
        onChange={(e) => setFilter(e.target.value)}
        size='small'
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position='end'>
                {(isLoading || isValidating) && <CircularProgress size={20} />}
                {filterString && (
                  <IconButton aria-label='clear search' size='small' onClick={() => setFilter('')} edge='end'>
                    <ClearIcon fontSize='small' />
                  </IconButton>
                )}
              </InputAdornment>
            )
          }
        }}
      />
      <Stack gap={1} flexWrap='wrap' direction='row'>
        {isValidating || isLoading ? (
          <Skeleton variant='rounded' height={25} />
        ) : filteredRepos?.length === 0 ? (
          <Typography variant='caption'>No results found</Typography>
        ) : (
          (filteredRepos || popularRepos).map((repo) => (
            <Box key={repo.id} flexBasis={{ xs: '100%', md: '49%' }}>
              <Link href={`https://github.com/${repo.owner}/${repo.name}`} target='_blank'>
                {repo.name}
              </Link>
            </Box>
          ))
        )}
      </Stack>
    </>
  );
}
