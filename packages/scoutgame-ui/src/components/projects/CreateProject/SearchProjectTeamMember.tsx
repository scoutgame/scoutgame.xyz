'use clieBox, nt';

import { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, Box, CircularProgress, InputAdornment, styled, TextField, Typography } from '@mui/material';
import type { BuilderSearchResult } from '@packages/scoutgame/builders/searchBuilders';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { useState } from 'react';

import { useSearchBuilders } from '../../../hooks/api/builders';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { Avatar } from '../../common/Avatar';
import { Dialog } from '../../common/Dialog';

const StyledAutocomplete = styled(Autocomplete<BuilderSearchResult>)({
  '& .MuiAutocomplete-popper': {
    zIndex: 1100
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: '20px'
  },
  '& .MuiAutocomplete-paper': {
    borderRadius: '10px'
  }
});

export function SearchProjectTeamMember({
  open,
  setOpen,
  onProjectMemberAdd
}: {
  onProjectMemberAdd: (projectMemberInfo: CreateScoutProjectFormValues['teamMembers'][number]) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 200);
  const { data: searchResults, isLoading } = useSearchBuilders(debouncedSearchTerm);
  // delay the loading state to avoid flickering
  const debouncedIsLoading = useDebouncedValue(isLoading, 500);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} title='Search project team member'>
      <StyledAutocomplete
        loading={debouncedIsLoading}
        loadingText='Loading...'
        size='small'
        renderOption={(props, option, { inputValue }) => {
          if (inputValue && inputValue.length >= 2 && searchResults?.length === 0) {
            return (
              <Box component='li' {...props} sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            );
          }
          return (
            <li {...props}>
              <Box
                component='a'
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
                onClick={() =>
                  onProjectMemberAdd({
                    avatar: option.avatar ?? '',
                    displayName: option.displayName,
                    scoutId: option.id,
                    role: 'member'
                  })
                }
              >
                <Avatar src={option.avatar} alt={option.displayName} sx={{ mr: 2 }} />
                <Typography variant='body1'>{option.displayName}</Typography>
              </Box>
            </li>
          );
        }}
        fullWidth
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        options={searchResults ?? []}
        getOptionLabel={(option) => option.displayName}
        onInputChange={(event, value) => setSearchTerm(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            variant='outlined'
            placeholder='Search for team members'
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }
            }}
          />
        )}
        noOptionsText='Search for team members'
      />
    </Dialog>
  );
}
