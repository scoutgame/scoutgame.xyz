'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import AddIcon from '@mui/icons-material/Add';
import { Stack, Button, Divider, FormLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import type { FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { postCreateCastMessage } from 'lib/postCreateCastMessage';
import { createProductUpdatesFrameAction } from 'lib/productUpdates/createProductUpdatesFrameAction';
import { schema, type FormValues } from 'lib/productUpdates/schema';
import type { ConnectProjectMinimal } from 'lib/projects/getConnectProjectsByFid';

export function ProductUpdatesCreateFrameForm({
  connectProjects,
  farcasterUser,
  onCreateProject,
  projectId
}: {
  farcasterUser: FarcasterUser;
  connectProjects: ConnectProjectMinimal[];
  onCreateProject: VoidFunction;
  projectId: string;
}) {
  const { control, handleSubmit, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      authorFid: farcasterUser.fid,
      projectId,
      text: '',
      createdAtLocal: new Date().toLocaleDateString()
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  useEffect(() => {
    setValue('projectId', projectId);
  }, [projectId]);

  const { execute, isExecuting } = useAction(createProductUpdatesFrameAction, {
    onSuccess: (data) => {
      reset();
      if (data.data) {
        const lines = data.data.productUpdatesFrame.text
          .split('\n')
          .filter((line) => line.trim().length)
          .slice(0, 10);

        postCreateCastMessage({
          embeds: [`https://${window.location.hostname}/product-updates/frames/${data.data.productUpdatesFrame.id}`],
          text: `${data.data.project.name}\n${data.data.productUpdatesFrame.createdAtLocal}\n\n${lines
            .map((line) => `• ${line}`)
            .join('\n')}`
        });
      }
    },
    onError: (err) => {
      log.error(err.error.serverError?.message || 'Something went wrong', err.error.serverError);
    }
  });

  return (
    <form
      onSubmit={handleSubmit((data) => {
        const locale = window.navigator.language;
        execute({
          ...data,
          createdAtLocal: new Date().toLocaleDateString(locale, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        });
      })}
    >
      <Stack gap={2}>
        <Controller
          control={control}
          name='projectId'
          render={({ field, fieldState }) => (
            <Select
              displayEmpty
              fullWidth
              disabled={isExecuting}
              renderValue={(value) => {
                if (value) {
                  return connectProjects.find((project) => project.id === value)?.name;
                }
                return <Typography color='secondary'>Select a project</Typography>;
              }}
              error={!!fieldState.error}
              {...field}
            >
              {connectProjects.map((connectProject) => (
                <MenuItem key={connectProject.id} value={connectProject.id}>
                  {connectProject.name}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem key='create-project' onClick={onCreateProject}>
                <AddIcon sx={{ mr: 0.5 }} fontSize='small' />
                Create project
              </MenuItem>
            </Select>
          )}
        />
        <Stack>
          <FormLabel id='text'>Product updates</FormLabel>
          <Controller
            control={control}
            name='text'
            render={({ field, fieldState }) => (
              <TextField
                disabled={isExecuting}
                multiline
                rows={8}
                aria-labelledby='product-updates'
                placeholder='1. Updated documentation ...'
                helperText='Provide a list of your product updates on each line. Empty lines will be ignored.'
                error={!!fieldState.error}
                {...field}
              />
            )}
          />
        </Stack>

        <Stack alignItems='flex-end'>
          <Button
            type='submit'
            size='large'
            sx={{
              width: 'fit-content'
            }}
            variant='contained'
            disabled={isExecuting}
          >
            Submit
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
