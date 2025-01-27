'use client';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, FormLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { fancyTrim } from '@packages/utils/strings';
import Image from 'next/image';
import { useState } from 'react';
import { Controller, useFieldArray, type Control } from 'react-hook-form';

import { Avatar } from '../../common/Avatar';

const chainRecords: Record<
  number,
  {
    chainId: number;
    image: string;
    name: string;
  }
> = {
  167000: {
    chainId: 167000,
    image: '/images/crypto/taiko.png',
    name: 'Taiko'
  }
};

export function ProjectSmartContractForm({ control }: { control: Control<CreateScoutProjectFormValues> }) {
  const [open, setOpen] = useState(false);
  const { fields, remove } = useFieldArray({
    control,
    name: 'contracts'
  });

  const contractIndex = fields.length - 1;

  return (
    <Stack>
      {fields.map((field, index) => (
        <Stack key={field.id} flexDirection='row' justifyContent='space-between' alignItems='center'>
          <Stack gap={1} flex={0.75} flexDirection='row'>
            <Typography>{fancyTrim(field.address)}</Typography>
            <Avatar src='/images/crypto/taiko.png' />
          </Stack>
          <Typography color='error'>Must sign with Deployer Address</Typography>
          <DeleteIcon onClick={() => remove(index)} color='error' sx={{ cursor: 'pointer' }} />
        </Stack>
      ))}

      {open && (
        <Stack flexDirection='row' alignItems='center' gap={2}>
          <Stack flex={0.75}>
            <FormLabel>Contract Address</FormLabel>
            <Controller
              control={control}
              name={`contracts.${contractIndex}.address`}
              render={({ field: contractField, fieldState }) => (
                <TextField
                  {...contractField}
                  error={!!fieldState.error}
                  placeholder='0x0000000...'
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>
          <Stack flex={0.25}>
            <FormLabel>Select chain</FormLabel>
            <Controller
              control={control}
              name={`contracts.${contractIndex}.chainId`}
              render={({ field: chainIdField, fieldState }) => (
                <Stack flexDirection='row' alignItems='center' gap={1} flex={1}>
                  <Select
                    {...chainIdField}
                    error={!!fieldState.error}
                    fullWidth
                    displayEmpty
                    renderValue={(chainId) =>
                      chainId ? (
                        <Stack flexDirection='row' alignItems='center' gap={1}>
                          <Image
                            width={25}
                            height={25}
                            src={chainRecords[chainId].image}
                            alt={chainRecords[chainId].name}
                            style={{ borderRadius: '50%' }}
                          />
                          <Typography>{chainRecords[chainId].name}</Typography>
                        </Stack>
                      ) : (
                        <Typography>No options selected</Typography>
                      )
                    }
                  >
                    {Object.entries(chainRecords).map(([chainId, chain]) => (
                      <MenuItem key={chainId} value={chainId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Image
                          width={25}
                          height={25}
                          src={chain.image}
                          alt={chain.name}
                          style={{ borderRadius: '50%' }}
                        />
                        <Typography>{chain.name}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                  <DeleteIcon
                    fontSize='small'
                    onClick={() => remove(contractIndex)}
                    color='error'
                    sx={{ cursor: 'pointer' }}
                  />
                </Stack>
              )}
            />
          </Stack>
        </Stack>
      )}
      {!open && (
        <Button
          variant='outlined'
          color='secondary'
          sx={{ width: 'fit-content' }}
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setOpen(true)}
        >
          Contract Address
        </Button>
      )}
    </Stack>
  );
}
