'use client';

import { Clear as ClearIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Stack,
  TextField,
  CircularProgress,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Link,
  FormControl,
  FormHelperText
} from '@mui/material';
import { useDebouncedValue } from '@packages/scoutgame-ui/hooks/useDebouncedValue';
import { useState, useEffect } from 'react';

import { useSearchReposByOwnerFromGithub } from 'hooks/api/github';

import type { RepoSearchResult } from '../../app/api/github/search-repos/route';

type Props = {
  value: number[];
  onChange: (repoIds: number[]) => void;
  partnerId?: string;
  error?: string;
  label?: string;
  required?: boolean;
  initialRepos?: { id: number; owner: string; name: string }[];
};

export function RepoSelector({
  value,
  onChange,
  partnerId,
  error,
  label = 'Repositories',
  required,
  initialRepos
}: Props) {
  const [searchInput, setSearchInput] = useState('');
  const [repoLookup, setRepoLookup] = useState<Record<number, { fullName: string; url: string }>>({});
  const debouncedSearchInput = useDebouncedValue(searchInput);

  // Initialize lookup with existing repos
  useEffect(() => {
    if (initialRepos && initialRepos.length > 0) {
      const lookup = initialRepos.reduce(
        (acc, repo) => {
          acc[repo.id] = {
            fullName: `${repo.owner}/${repo.name}`,
            url: `https://github.com/${repo.owner}/${repo.name}`
          };
          return acc;
        },
        {} as Record<number, { fullName: string; url: string }>
      );
      setRepoLookup(lookup);
    }
  }, [initialRepos]);

  const {
    data: searchResults,
    error: searchError,
    isValidating,
    isLoading
  } = useSearchReposByOwnerFromGithub(debouncedSearchInput, partnerId);

  const availableRepos = searchResults?.filter((repo) => !value.includes(repo.id)) || [];

  const handleAddRepo = (repo: RepoSearchResult) => {
    // Add to lookup for display purposes
    setRepoLookup((prev) => ({
      ...prev,
      [repo.id]: {
        fullName: repo.fullName,
        url: repo.url
      }
    }));

    // Update form value
    onChange([...value, repo.id]);
  };

  const handleRemoveRepo = (repoId: number) => {
    onChange(value.filter((id) => id !== repoId));
  };

  const clearSearch = () => {
    setSearchInput('');
  };

  // Get repo details for display, with fallback for repos not in lookup
  const getRepoDetails = (repoId: number) => {
    return (
      repoLookup[repoId] || {
        fullName: `Repository ${repoId}`,
        url: `https://github.com/repo/${repoId}`
      }
    );
  };

  return (
    <FormControl error={!!error} sx={{ width: '100%' }}>
      <Typography variant='subtitle2' gutterBottom>
        {label}
        {required && (
          <Box component='span' sx={{ color: 'error.main', ml: 0.5 }}>
            *
          </Box>
        )}
      </Typography>

      {/* Selected Repos List */}
      <Box sx={{ mb: 2 }}>
        <Typography variant='body2' color='textSecondary' gutterBottom>
          Selected Repositories ({value.length})
        </Typography>
        <Stack direction='row' spacing={1} flexWrap='wrap' sx={{ gap: 1 }}>
          {value.length === 0 ? (
            <Typography variant='body2' color='textSecondary' sx={{ fontStyle: 'italic' }}>
              No repositories selected
            </Typography>
          ) : (
            value.map((repoId) => {
              const repo = getRepoDetails(repoId);
              return (
                <Chip
                  key={repoId}
                  label={repo.fullName}
                  onDelete={(e) => {
                    e.stopPropagation();
                    handleRemoveRepo(repoId);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(repo.url, '_blank');
                  }}
                  sx={{
                    maxWidth: 250,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      '& .MuiChip-deleteIcon': {
                        color: 'error.main'
                      }
                    },
                    '& .MuiChip-deleteIcon': {
                      transition: 'color 0.2s ease-in-out',
                      '&:hover': {
                        color: 'error.dark'
                      }
                    }
                  }}
                />
              );
            })
          )}
        </Stack>
      </Box>

      {/* Search Bar */}
      <TextField
        label='Search GitHub repositories'
        placeholder='Enter owner or owner/repo'
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        size='small'
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position='end'>
                {(isLoading || isValidating) && <CircularProgress size={20} />}
                {searchInput && (
                  <IconButton aria-label='clear search' size='small' onClick={clearSearch} edge='end'>
                    <ClearIcon fontSize='small' />
                  </IconButton>
                )}
              </InputAdornment>
            )
          }
        }}
      />

      {/* Search Results */}
      {searchError && (
        <Typography variant='caption' color='error' sx={{ mb: 2 }}>
          {searchError.message || 'Error searching repositories'}
        </Typography>
      )}

      {debouncedSearchInput && !isValidating && !isLoading && searchResults && (
        <Box sx={{ mb: 2 }}>
          <Typography variant='body2' color='textSecondary' gutterBottom>
            {availableRepos.length === 0
              ? 'No new repositories found'
              : `Found ${availableRepos.length} new repository${availableRepos.length === 1 ? '' : 'ies'}`}
          </Typography>
          <Stack spacing={1} sx={{ maxHeight: 200, overflow: 'auto' }}>
            {availableRepos.map((repo) => (
              <Box
                key={repo.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Link href={repo.url} target='_blank' variant='body2' sx={{ fontWeight: 'medium' }}>
                    {repo.fullName}
                  </Link>
                </Box>
                <Button size='small' variant='outlined' onClick={() => handleAddRepo(repo)}>
                  Add
                </Button>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {error && <FormHelperText error>{error}</FormHelperText>}
    </FormControl>
  );
}
