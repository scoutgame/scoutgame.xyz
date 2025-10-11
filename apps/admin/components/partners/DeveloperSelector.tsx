'use client';

import { Clear as ClearIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Box,
  TextField,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
  FormHelperText,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Stack,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import { useGetUser, useSearchForUser } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';

// A lightweight selector to add/remove developers (scouts) by path or fid search
// Accepts and returns an array of Scout ids (UUID strings)

export function DeveloperSelector({
  value,
  onChange,
  error,
  label = 'Blacklisted Developers'
}: {
  value: string[];
  onChange: (developerIds: string[]) => void;
  error?: string;
  label?: string;
}) {
  const [input, setInput] = useState('');
  const debounced = useDebouncedValue(input);
  const { data: result, isLoading, isValidating, error: searchError } = useSearchForUser(debounced, true);

  const addDeveloper = (id: string) => {
    if (!value.includes(id)) {
      onChange([...value, id]);
    }
    setInput('');
  };

  const removeDeveloper = (id: string) => {
    onChange(value.filter((x) => x !== id));
  };

  return (
    <FormControl error={!!(error || searchError)} sx={{ width: '100%' }}>
      <Typography variant='subtitle2' gutterBottom>
        {label}
      </Typography>

      {/* Selected developers */}
      <List
        dense
        sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
      >
        {value.length === 0 && (
          <ListItem>
            <ListItemText primaryTypographyProps={{ color: 'text.secondary' }} primary='No developers selected' />
          </ListItem>
        )}
        {value.map((id) => (
          <SelectedDeveloperItem key={id} id={id} onRemove={removeDeveloper} />
        ))}
      </List>

      {/* Search bar */}
      <TextField
        label='Search by scoutgame path or github login'
        placeholder='e.g., alice'
        value={input}
        onChange={(e) => setInput(e.target.value)}
        size='small'
        sx={{ my: 2 }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position='end'>
                {(isLoading || isValidating) && <CircularProgress size={20} />}
                {input && (
                  <IconButton aria-label='clear search' size='small' onClick={() => setInput('')} edge='end'>
                    <ClearIcon fontSize='small' />
                  </IconButton>
                )}
              </InputAdornment>
            )
          }
        }}
      />

      {/* Quick result display with add button */}
      {debounced && result && (
        <Box sx={{ p: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
          {result.scout ? (
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
              <Stack direction='row' alignItems='center' spacing={1}>
                {result.scout.avatar ? (
                  <Avatar src={result.scout.avatar} alt={result.scout.path} sx={{ width: 32, height: 32 }} />
                ) : (
                  <Avatar sx={{ width: 20, height: 20, padding: 2 }}>{result.scout.displayName[0]}</Avatar>
                )}
                <Typography>
                  {result.scout.displayName || result.scout.path} — {result.scout.path}
                </Typography>
              </Stack>
              <Button size='small' startIcon={<AddIcon />} onClick={() => addDeveloper(result.scout!.id)}>
                Add
              </Button>
            </Stack>
          ) : (
            <Typography color='text.secondary'>No matching developer found</Typography>
          )}
        </Box>
      )}

      {(error || searchError) && (
        <FormHelperText error>{error || (searchError as any)?.message || 'Error searching for user'}</FormHelperText>
      )}
    </FormControl>
  );
}

function SelectedDeveloperItem({ id, onRemove }: { id: string; onRemove: (id: string) => void }) {
  const { data, isLoading } = useGetUser(id);
  const primary = data?.displayName || data?.path || id;
  const secondary = data?.path && data?.path !== data?.displayName ? `@${data.path}` : undefined;

  return (
    <ListItem
      secondaryAction={
        <IconButton edge='end' aria-label='remove' color='error' onClick={() => onRemove(id)}>
          <DeleteIcon fontSize='small' />
        </IconButton>
      }
    >
      <ListItemAvatar>
        {data?.avatar ? (
          <Avatar src={data.avatar} alt={data.path} sx={{ width: 42, height: 42 }} />
        ) : (
          <Avatar sx={{ width: 42, height: 42, padding: 2 }}>{data?.displayName[0]}</Avatar>
        )}
      </ListItemAvatar>
      <ListItemText
        primaryTypographyProps={{ sx: { wordBreak: 'break-word' } }}
        primary={isLoading ? 'Loading…' : primary}
        secondary={isLoading ? undefined : secondary}
      />
    </ListItem>
  );
}
