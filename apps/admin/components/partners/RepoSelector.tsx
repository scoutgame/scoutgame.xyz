'use client';

import { Clear as ClearIcon, Add as AddAllIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Box,
  TextField,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
  FormHelperText,
  Typography
} from '@mui/material';
import { useDebouncedValue } from '@packages/scoutgame-ui/hooks/useDebouncedValue';
import type { GetReposResult } from 'app/api/github/get-repos/route';
import { useState, useEffect } from 'react';

import { useGetGithubReposFromDatabase } from 'hooks/api/github';

import { RepoOrgSection } from './RepoOrgSection';

type Props = {
  value: number[];
  onChange: (repoIds: number[]) => void;
  error?: string;
  label?: string;
  required?: boolean;
  initialRepos?: { id: number; owner: string; name: string }[];
};

export function RepoSelector({ value, onChange, error, label = 'Repositories', required, initialRepos }: Props) {
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
  } = useGetGithubReposFromDatabase(debouncedSearchInput, false);

  const availableRepos = searchResults?.filter((repo) => !value.includes(repo.id)) || [];

  // Group available repos by organization
  const groupedRepos = availableRepos.reduce(
    (acc, repo) => {
      const org = repo.fullName.split('/')[0];
      if (!acc[org]) {
        acc[org] = [];
      }
      acc[org].push(repo);
      return acc;
    },
    {} as Record<string, GetReposResult[]>
  );

  const handleAddRepo = (repo: GetReposResult) => {
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

  const handleSelectAllInOrg = (orgRepos: GetReposResult[]) => {
    const newRepoIds = orgRepos.map((repo) => repo.id);
    const newLookup = orgRepos.reduce(
      (acc, repo) => {
        acc[repo.id] = {
          fullName: repo.fullName,
          url: repo.url
        };
        return acc;
      },
      {} as Record<number, { fullName: string; url: string }>
    );

    // Add to lookup for display purposes
    setRepoLookup((prev) => ({
      ...prev,
      ...newLookup
    }));

    // Update form value
    onChange([...value, ...newRepoIds]);
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

  const handleRemoveAllFromOrg = (orgName: string) => {
    const selectedRepos = value.map((id) => getRepoDetails(id));
    const reposToRemove = selectedRepos.filter((repo) => repo.fullName.startsWith(`${orgName}/`));
    const repoIdsToRemove = reposToRemove
      .map((repo) => {
        // Find the repo ID from the lookup
        return Object.entries(repoLookup).find(([_, details]) => details.fullName === repo.fullName)?.[0];
      })
      .filter(Boolean)
      .map(Number);

    onChange(value.filter((id) => !repoIdsToRemove.includes(id)));
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
      <RepoOrgSection
        title={`Selected Repositories (${value.length})`}
        repos={value.map((id) => ({ id, ...getRepoDetails(id) }))}
        emptyMessage='No repositories selected'
        orgActionIcon={<DeleteIcon fontSize='small' />}
        orgActionColor='error'
        orgActionLabel='Remove'
        repoActionLabel='Remove'
        onOrgAction={(org, orgRepos) => handleRemoveAllFromOrg(org)}
        onRepoAction={(repo) => handleRemoveRepo(repo.id)}
        maxHeight={200}
      />

      {/* Search Bar */}
      <TextField
        label='Search GitHub repositories'
        placeholder='Enter owner or owner/repo'
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        size='small'
        sx={{ mb: 3, mt: 2 }}
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
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Box component='span' sx={{ color: 'error.main', fontSize: '0.75rem' }}>
            {searchError.message || 'Error searching repositories'}
          </Box>
        </Box>
      )}

      {debouncedSearchInput && !isValidating && !isLoading && searchResults && (
        <RepoOrgSection
          title={
            availableRepos.length === 0
              ? ''
              : `Found ${availableRepos.length} new repositor${availableRepos.length === 1 ? 'y' : 'ies'} across ${Object.keys(groupedRepos).length} organization${Object.keys(groupedRepos).length === 1 ? '' : 's'}`
          }
          repos={availableRepos.map((repo) => ({ id: repo.id, fullName: repo.fullName, url: repo.url }))}
          emptyMessage='No new repositories found'
          orgActionIcon={<AddAllIcon fontSize='small' />}
          orgActionColor='primary'
          orgActionLabel='Select all'
          repoActionLabel='Add'
          onOrgAction={(org, orgRepos) => handleSelectAllInOrg(orgRepos as any)}
          onRepoAction={(repo) => handleAddRepo(repo as any)}
          maxHeight={200}
        />
      )}

      {error && <FormHelperText error>{error}</FormHelperText>}
    </FormControl>
  );
}
