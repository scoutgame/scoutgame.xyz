'use client';

import { log } from '@charmverse/core/log';
import type { ScoutPartnerStatus } from '@charmverse/core/prisma-client';
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

import { useEditScoutPartner } from 'hooks/api/scout-partners';
import type { EditScoutPartnerPayload } from 'lib/scout-partners/editScoutPartnerSchema';
import { editScoutPartnerSchema } from 'lib/scout-partners/editScoutPartnerSchema';
import type { ScoutPartnerWithRepos } from 'lib/scout-partners/getScoutPartners';

import { DeveloperSelector } from './DeveloperSelector';
import { IssueTagAmountFields } from './IssueTagAmountFields';
import { RepoSelector } from './RepoSelector';

type Props = {
  partner: ScoutPartnerWithRepos;
  onClose: () => void;
  onSuccess: (partner: ScoutPartnerWithRepos) => void;
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
    setValue,
    formState: { errors, isValid, isDirty }
  } = useForm<EditScoutPartnerPayload>({
    defaultValues: {
      status: partner.status,
      tokenAmountPerPullRequest: partner.tokenAmountPerPullRequest ?? undefined,
      issueTagTokenAmounts: (partner.issueTagTokenAmounts as { tag: string; amount: number }[]) ?? [],
      repoIds: partner.repos?.map((repo) => repo.id) ?? [],
      blacklistedDeveloperIds: partner.blacklistedDevelopers?.map((b) => b.developerId) ?? []
    },
    resolver: yupResolver(editScoutPartnerSchema),
    mode: 'onChange'
  });

  const onSubmit = handleSubmit((data: EditScoutPartnerPayload) => {
    setIsSubmitting(true);
    editScoutPartner(data)
      .then((res) => {
        onSuccess(res);
        onClose();
      })
      .finally(() => {
        setIsSubmitting(false);
      })
      .catch((error) => {
        log.error('Error updating scout partner', { error });
      });
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

        <Controller
          name='repoIds'
          control={control}
          render={({ field }) => (
            <RepoSelector
              value={field.value}
              onChange={field.onChange}
              error={errors.repoIds?.message}
              label='Repositories'
              initialRepos={partner.repos}
            />
          )}
        />

        <Controller
          name='blacklistedDeveloperIds'
          control={control}
          render={({ field }) => (
            <DeveloperSelector
              value={(field.value as string[]) || []}
              onChange={field.onChange}
              error={errors.blacklistedDeveloperIds?.message}
              label='Blacklisted Developers'
            />
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

            <IssueTagAmountFields control={control} errors={errors} />
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
