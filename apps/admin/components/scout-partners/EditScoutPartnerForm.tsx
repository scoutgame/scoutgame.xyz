'use client';

import { log } from '@charmverse/core/log';
import type { ScoutPartner, ScoutPartnerStatus } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Stack,
  TextField,
  Typography,
  FormControl,
  FormHelperText,
  Button,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Box
} from '@mui/material';
import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

import { useEditScoutPartner } from 'hooks/api/scout-partners';
import type { EditScoutPartnerPayload } from 'lib/scout-partners/editScoutPartnerSchema';
import { editScoutPartnerSchema } from 'lib/scout-partners/editScoutPartnerSchema';

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

export function EditScoutPartnerForm({ partner, onClose, onSuccess }: Props) {
  const { trigger: editScoutPartner } = useEditScoutPartner(partner.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty }
  } = useForm<EditScoutPartnerPayload>({
    defaultValues: {
      status: partner.status,
      tokenAmountPerPullRequest: partner.tokenAmountPerPullRequest ?? undefined,
      issueTagTokenAmounts: (partner.issueTagTokenAmounts as { tag: string; amount: number }[]) ?? []
    },
    resolver: yupResolver(editScoutPartnerSchema),
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'issueTagTokenAmounts'
  });

  const onSubmit = handleSubmit(async (data: EditScoutPartnerPayload) => {
    try {
      setIsSubmitting(true);
      const updatedPartner = await editScoutPartner(data);
      onSuccess(updatedPartner);
      onClose();
    } catch (error) {
      log.error('Error updating scout partner', { error });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit}>
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

            <Stack spacing={2}>
              <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant='subtitle1'>Issue Tag Token Amounts</Typography>
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => append({ tag: '', amount: 0 })}
                  variant='outlined'
                  size='small'
                >
                  Add Tag
                </Button>
              </Stack>

              {fields.map((arrayField, index) => (
                <Box key={arrayField.id} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Controller
                    name={`issueTagTokenAmounts.${index}.tag`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        sx={{ flex: 1 }}
                        label='Tag'
                        error={!!errors.issueTagTokenAmounts?.[index]?.tag}
                        helperText={errors.issueTagTokenAmounts?.[index]?.tag?.message}
                        size='small'
                      />
                    )}
                  />
                  <Controller
                    name={`issueTagTokenAmounts.${index}.amount`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type='number'
                        sx={{ flex: 1 }}
                        label='Amount'
                        error={!!errors.issueTagTokenAmounts?.[index]?.amount}
                        helperText={errors.issueTagTokenAmounts?.[index]?.amount?.message}
                        size='small'
                      />
                    )}
                  />
                  <IconButton onClick={() => remove(index)} size='small' color='error'>
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </>
        )}

        <Stack direction='row' spacing={2} justifyContent='flex-end'>
          <Button variant='outlined' onClick={onClose}>
            Cancel
          </Button>
          <Button type='submit' variant='contained' color='primary' disabled={!isValid || isSubmitting || !isDirty}>
            Update Partner
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
