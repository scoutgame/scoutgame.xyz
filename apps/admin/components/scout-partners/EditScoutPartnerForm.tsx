'use client';

import { log } from '@charmverse/core/log';
import type { ScoutPartner, ScoutPartnerStatus } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Stack,
  TextField,
  Typography,
  FormControl,
  FormHelperText,
  Button,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';

import { useUpdateScoutPartner } from 'hooks/api/scout-partners';

type FormData = {
  tokenAmountPerPullRequest?: number;
  status: ScoutPartnerStatus;
  tokenSymbol?: string;
};

type Props = {
  partner: ScoutPartner;
  onClose: () => void;
  onSuccess: (partner: ScoutPartner) => void;
};

const statusOptions: { value: ScoutPartnerStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' }
];

const editScoutPartnerSchema = yup.object({
  status: yup.string<ScoutPartnerStatus>().oneOf(['active', 'paused', 'completed']).required('Status is required'),
  tokenAmountPerPullRequest: yup.number().optional(),
  tokenSymbol: yup.string().optional()
});

export function EditScoutPartnerForm({ partner, onClose, onSuccess }: Props) {
  const { trigger: updateScoutPartner } = useUpdateScoutPartner(partner.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<FormData>({
    defaultValues: {
      status: partner.status,
      tokenAmountPerPullRequest: partner.tokenAmountPerPullRequest ?? undefined,
      tokenSymbol: partner.tokenSymbol ?? undefined
    },
    resolver: yupResolver(editScoutPartnerSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      const updatedPartner = await updateScoutPartner(data);
      onSuccess(updatedPartner);
      onClose();
    } catch (error) {
      log.error('Error updating scout partner', { error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <Typography variant='h6'>Edit Scout Partner</Typography>

        <Controller
          name='status'
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id='status-label'>Status</InputLabel>
              <Select {...field} labelId='status-label' label='Status' error={!!errors.status}>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.status && <FormHelperText error>{errors.status.message}</FormHelperText>}
            </FormControl>
          )}
        />

        {partner.tokenAddress && (
          <>
            <Controller
              name='tokenAmountPerPullRequest'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type='number'
                  label='Token Amount per PR'
                  error={!!errors.tokenAmountPerPullRequest}
                  helperText={errors.tokenAmountPerPullRequest?.message}
                />
              )}
            />

            <Controller
              name='tokenSymbol'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Token Symbol'
                  error={!!errors.tokenSymbol}
                  helperText={errors.tokenSymbol?.message}
                />
              )}
            />
          </>
        )}

        <Stack direction='row' spacing={2} justifyContent='flex-end'>
          <Button variant='outlined' onClick={onClose}>
            Cancel
          </Button>
          <Button type='submit' variant='contained' color='primary' disabled={!isValid || isSubmitting}>
            Update Partner
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
