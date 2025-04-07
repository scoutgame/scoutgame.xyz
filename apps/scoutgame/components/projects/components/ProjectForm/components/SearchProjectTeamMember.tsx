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
  Chip,
  Tooltip
} from '@mui/material';
import type { BuilderSearchResult } from '@packages/scoutgame/builders/searchBuilders';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { Dialog } from '@packages/scoutgame-ui/components/common/Dialog';
import { useDebouncedValue } from '@packages/scoutgame-ui/hooks/useDebouncedValue';
import { useCallback, useMemo, useState } from 'react';

import { useSearchBuilders } from 'hooks/api/builders';

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

const MAX_TEAM_MEMBERS = 5;

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
    setOpen(false);
    setSearchTerm('');
    setSelectedMembers([]);
  }, [selectedMembers, onProjectMembersAdd, setOpen, setSearchTerm, setSelectedMembers]);

  const filteredSearchResults = useMemo(() => {
    return searchResults?.filter((option) => !filteredMemberIds.includes(option.id)) ?? [];
  }, [searchResults, filteredMemberIds]);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title='Search project team members'
      sx={{
        '&': { zIndex: 1 },
        '& .MuiDialog-paper': {
          width: '400px',
          maxWidth: '400px',
          height: '100%',
          maxHeight: '500px'
        }
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
          onChange={(_, newValue) => setSelectedMembers(newValue)}
          multiple
          fullWidth
          open={open && filteredSearchResults.length > 0}
          options={filteredSearchResults}
          getOptionLabel={(option) => option.displayName}
          onInputChange={(_, value) => setSearchTerm(value)}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.id}
                label={option.displayName}
                avatar={<Avatar src={option.avatar} alt={option.displayName} />}
                sx={{
                  maxWidth: '200px',
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
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
        <Tooltip
          title={
            selectedMembers.length >= MAX_TEAM_MEMBERS
              ? 'Maximum 5 team members allowed'
              : selectedMembers.length === 0
                ? 'Select at least one member'
                : ''
          }
        >
          <span style={{ width: 'fit-content' }}>
            <Button
              color='secondary'
              variant='outlined'
              onClick={addProjectMembers}
              disabled={selectedMembers.length === 0 || selectedMembers.length >= MAX_TEAM_MEMBERS}
            >
              Add members
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Dialog>
  );
}
