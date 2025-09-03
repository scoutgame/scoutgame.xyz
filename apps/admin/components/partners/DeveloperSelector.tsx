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
  Stack
} from '@mui/material';
import { useState } from 'react';

import { useSearchForUser } from 'hooks/api/users';
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
  const { data: result, isLoading, isValidating, error: searchError } = useSearchForUser(debounced);

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
          <ListItem
            key={id}
            secondaryAction={
              <IconButton edge='end' aria-label='remove' onClick={() => removeDeveloper(id)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            }
          >
            <ListItemText primary={id} />
          </ListItem>
        ))}
      </List>

      {/* Search bar */}
      <TextField
        label='Search by scoutgame path'
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
              <Typography>
                {result.scout.displayName || result.scout.path} — {result.scout.path}
              </Typography>
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
