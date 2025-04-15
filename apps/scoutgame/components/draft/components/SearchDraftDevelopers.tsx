'use client';

import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SearchDraftDevelopers() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  return (
    <TextField
      placeholder='Search for a developer'
      variant='outlined'
      fullWidth
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon />
            </InputAdornment>
          )
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if (searchTerm) {
            router.push(`/draft/register?search=${searchTerm}`);
          } else {
            router.push(`/draft/register`);
          }
        }
      }}
    />
  );
}
