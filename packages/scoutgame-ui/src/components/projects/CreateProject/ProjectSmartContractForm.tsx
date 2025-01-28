'use client';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, FormLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { fancyTrim } from '@packages/utils/strings';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useFieldArray, type Control } from 'react-hook-form';

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
  const [tempContract, setTempContract] = useState<{ address: string; chainId: number } | null>(null);
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contracts'
  });

  const onCancel = useCallback(() => {
    setTempContract(null);
    setOpen(false);
  }, [setTempContract, setOpen]);

  const onSave = useCallback(() => {
    if (tempContract) {
      append(tempContract);
      setTempContract(null);
      setOpen(false);
    }
  }, [append, tempContract, setTempContract, setOpen]);

  const onCreate = useCallback(() => {
    setTempContract({
      address: '',
      chainId: 167000
    });
    setOpen(true);
  }, [setTempContract, setOpen]);

  return (
    <Stack gap={2}>
      {fields.map((field, index) => (
        <Stack flexDirection='row' alignItems='center' gap={1} key={field.id}>
          <Stack
            justifyContent='space-between'
            flexDirection='row'
            alignItems='center'
            flex={1}
            bgcolor='background.paper'
            p={1}
            borderRadius={1}
          >
            <Stack gap={1} flex={0.75} flexDirection='row'>
              <Image
                src={chainRecords[field.chainId].image}
                width={25}
                height={25}
                alt={chainRecords[field.chainId].name}
                style={{ borderRadius: '50%' }}
              />
              <Typography>{fancyTrim(field.address)}</Typography>
            </Stack>
            <Typography color='error' variant='body2'>
              Must sign with Deployer Address
            </Typography>
          </Stack>
          <DeleteIcon fontSize='small' onClick={() => remove(index)} color='error' sx={{ cursor: 'pointer' }} />
        </Stack>
      ))}

      {open && (
        <Stack flexDirection='row' alignItems='center' gap={2}>
          <Stack flex={0.75}>
            <FormLabel>Contract Address</FormLabel>
            <TextField
              value={tempContract?.address}
              onChange={(e) => setTempContract(tempContract ? { ...tempContract, address: e.target.value } : null)}
              placeholder='0x0000000...'
            />
          </Stack>
          <Stack flex={0.25}>
            <FormLabel>Select chain</FormLabel>
            <Stack flexDirection='row' alignItems='center' gap={1} flex={1}>
              <Select
                value={tempContract?.chainId}
                onChange={(e) =>
                  setTempContract(tempContract ? { ...tempContract, chainId: e.target.value as number } : null)
                }
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
                    <Image width={25} height={25} src={chain.image} alt={chain.name} style={{ borderRadius: '50%' }} />
                    <Typography>{chain.name}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        </Stack>
      )}
      {!open ? (
        <Button
          variant='outlined'
          color='secondary'
          sx={{ width: 'fit-content' }}
          startIcon={<AddCircleOutlineIcon />}
          onClick={onCreate}
        >
          Contract Address
        </Button>
      ) : (
        <Stack flexDirection='row' gap={2} justifyContent='flex-end'>
          <Button variant='outlined' color='primary' sx={{ width: 'fit-content' }} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant='contained' color='primary' sx={{ width: 'fit-content' }} onClick={onSave}>
            Save
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
