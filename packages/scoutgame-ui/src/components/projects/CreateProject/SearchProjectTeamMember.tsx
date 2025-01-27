'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  styled,
  TextField,
  Typography,
  Chip
} from '@mui/material';
import type { BuilderSearchResult } from '@packages/scoutgame/builders/searchBuilders';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { useCallback, useMemo, useState } from 'react';

import { useSearchBuilders } from '../../../hooks/api/builders';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { Avatar } from '../../common/Avatar';
import { Dialog } from '../../common/Dialog';

const StyledAutocomplete = styled(Autocomplete<BuilderSearchResult, true>)({
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
  onProjectMembersAdd,
  filteredMemberIds
}: {
  filteredMemberIds: string[];
  onProjectMembersAdd: (projectMembersInfo: CreateScoutProjectFormValues['teamMembers']) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 200);
  const { data: searchResults, isLoading } = useSearchBuilders(debouncedSearchTerm);
  // delay the loading state to avoid flickering
  const debouncedIsLoading = useDebouncedValue(isLoading, 500);
  const [selectedMembers, setSelectedMembers] = useState<BuilderSearchResult[]>([]);

  const addProjectMembers = useCallback(() => {
    onProjectMembersAdd(
      selectedMembers.map((member) => ({
        avatar: member.avatar ?? '',
        displayName: member.displayName,
        scoutId: member.id,
        role: 'member'
      }))
    );
  }, [selectedMembers, onProjectMembersAdd]);

  const filteredSearchResults = useMemo(() => {
    return searchResults?.filter((option) => !filteredMemberIds.includes(option.id)) ?? [];
  }, [searchResults, filteredMemberIds]);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title='Search project team member'
      sx={{
        '&': { zIndex: 1 },
        '& .MuiDialog-paper': { minWidth: '400px', height: '100%' }
      }}
    >
      <Stack gap={2}>
        <StyledAutocomplete
          loading={debouncedIsLoading}
          loadingText='Loading...'
          size='small'
          noOptionsText=''
          renderOption={(props, option, { inputValue }) => {
            if (inputValue && inputValue.length >= 2 && filteredSearchResults?.length === 0) {
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
                >
                  <Avatar src={option.avatar} alt={option.displayName} sx={{ mr: 2 }} />
                  <Typography variant='body1'>{option.displayName}</Typography>
                </Box>
              </li>
            );
          }}
          value={selectedMembers}
          onChange={(event, newValue) => setSelectedMembers(newValue)}
          multiple
          fullWidth
          open={open && filteredSearchResults.length > 0}
          options={filteredSearchResults}
          getOptionLabel={(option) => option.displayName}
          onInputChange={(event, value) => setSearchTerm(value)}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.id}
                label={option.displayName}
                avatar={<Avatar src={option.avatar} alt={option.displayName} />}
                sx={{ borderRadius: '16px' }}
                variant='outlined'
                size='small'
                onDelete={() => {
                  setSelectedMembers(selectedMembers.filter((selectedMember) => selectedMember.id !== option.id));
                }}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              variant='outlined'
              placeholder='Search for team members'
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                )
              }}
            />
          )}
        />
        <Button
          color='secondary'
          variant='outlined'
          sx={{
            width: 'fit-content'
          }}
          onClick={addProjectMembers}
          disabled={selectedMembers.length === 0}
        >
          Add members
        </Button>
      </Stack>
    </Dialog>
  );
}
