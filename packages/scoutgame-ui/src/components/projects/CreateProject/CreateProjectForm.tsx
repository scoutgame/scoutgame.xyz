'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import LoadingButton from '@mui/lab/LoadingButton';
import { Button, Divider, FormLabel, Stack, TextField } from '@mui/material';
import { createScoutProjectAction } from '@packages/scoutgame/projects/createScoutProjectAction';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { createScoutProjectSchema } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';

import { FormErrors } from '../../common/FormErrors';

import { ProjectAvatarField } from './ProjectAvatarField';

export function CreateProjectForm({ onCancel }: { onCancel: VoidFunction }) {
  const [errors, setErrors] = useState<string[] | null>(null);
  const {
    control,
    getValues,
    formState: { isDirty },
    handleSubmit
  } = useForm({
    resolver: yupResolver(createScoutProjectSchema),
    mode: 'onChange',
    defaultValues: {
      avatar: '',
      name: '',
      description: '',
      website: '',
      github: ''
    }
  });

  const router = useRouter();

  const { execute: createProject, isExecuting } = useAction(createScoutProjectAction, {
    onSuccess: (data) => {
      if (data?.data) {
        router.push(`/projects/${data?.data.id}`);
      }
    }
  });

  function onInvalid(fieldErrors: FieldErrors) {
    setErrors(['The form is invalid. Please check the fields and try again.']);
    log.warn('Invalid form submission', { fieldErrors, values: getValues() });
  }

  const onSubmit = (data: CreateScoutProjectFormValues) => {
    createProject(data);
  };

  return (
    <Stack>
      <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Stack gap={3}>
          <Stack>
            <FormLabel>Logo</FormLabel>
            <ProjectAvatarField control={control} isLoading={isExecuting} />
          </Stack>
          <Stack>
            <FormLabel required>Name</FormLabel>
            <Controller
              control={control}
              name='name'
              render={({ field, fieldState }) => (
                <TextField
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder='Smart Contract'
                  required
                  {...field}
                />
              )}
            />
          </Stack>
          <Stack>
            <FormLabel>Description</FormLabel>
            <Controller
              control={control}
              name='description'
              render={({ field, fieldState }) => (
                <TextField
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  multiline
                  minRows={3}
                  placeholder='Brief project summary'
                  {...field}
                />
              )}
            />
          </Stack>
          <Stack>
            <FormLabel>Project Website</FormLabel>
            <Controller
              control={control}
              name='website'
              render={({ field, fieldState }) => (
                <TextField
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder='https://example.com'
                  {...field}
                />
              )}
            />
          </Stack>
          <Stack>
            <FormLabel>Repository</FormLabel>
            <Controller
              control={control}
              name='github'
              render={({ field, fieldState }) => (
                <TextField
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder='https://github.com/example/project'
                  {...field}
                />
              )}
            />
          </Stack>
          <Divider />
          <FormErrors errors={errors} />
          <Divider />
          <Stack gap={2} flexDirection='row' justifyContent='flex-end'>
            <Button variant='outlined' color='primary' onClick={onCancel}>
              Cancel
            </Button>
            <LoadingButton
              variant='contained'
              color='primary'
              type='submit'
              loading={isExecuting}
              disabled={isExecuting || !isDirty}
              sx={{ width: 'fit-content' }}
            >
              Save
            </LoadingButton>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
}
