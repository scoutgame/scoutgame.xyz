'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import LoadingButton from '@mui/lab/LoadingButton';
import { Button, Divider, FormLabel, Stack, TextField } from '@mui/material';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getUserScoutProjects';
import { updateScoutProjectAction } from '@packages/scoutgame/projects/updateScoutProjectAction';
import { updateScoutProjectSchema } from '@packages/scoutgame/projects/updateScoutProjectSchema';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';

import { useMdScreen } from '../../../../../hooks/useMediaScreens';
import { FormErrors } from '../../../../common/FormErrors';
import { ProjectAvatarField } from '../../../../create-project/components/ProjectAvatarField';

export function EditProjectForm({ project }: { project: ScoutProjectDetailed }) {
  const isMdScreen = useMdScreen();
  const [errors, setErrors] = useState<string[] | null>(null);
  const {
    control,
    formState: { isDirty },
    handleSubmit
  } = useForm({
    resolver: yupResolver(updateScoutProjectSchema),
    mode: 'onChange',
    defaultValues: {
      projectId: project.id,
      avatar: project.avatar,
      name: project.name,
      description: project.description,
      website: project.website,
      github: project.github,
      teamMembers: project.teamMembers.map((member) => ({
        ...member,
        scoutId: member.id
      })),
      contracts: project.contracts.map((contract) => ({
        address: contract.address,
        chainId: contract.chainId,
        deployerAddress: project.deployers.find((deployer) => deployer.id === contract.deployerId)?.address
      })),
      deployers: project.deployers.map((deployer) => ({
        address: deployer.address
      }))
    }
  });

  const router = useRouter();

  const { execute: updateProject, isExecuting } = useAction(updateScoutProjectAction, {
    onSuccess: (data) => {
      if (data?.data) {
        router.push(`/projects/${data?.data.path}`);
      }
    }
  });

  function onInvalid(fieldErrors: FieldErrors) {
    setErrors([
      `The form is invalid. ${Object.values(fieldErrors)
        .map((error) => error?.message)
        .join(', ')}`
    ]);
    log.warn('Invalid form submission', { fieldErrors });
  }

  const onSubmit = () => {
    handleSubmit(updateProject, onInvalid)();
  };

  return (
    <>
      <Stack
        sx={{
          gap: 3,
          mb: 2
        }}
      >
        <Stack gap={3}>
          <Stack>
            <FormLabel>Logo</FormLabel>
            <ProjectAvatarField control={control} isLoading={isExecuting} avatarSize={isMdScreen ? 150 : 100} />
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
        </Stack>
        <Divider />
        <FormErrors errors={errors} />
      </Stack>
      <Stack
        gap={2}
        flexDirection='row'
        justifyContent='flex-end'
        position='sticky'
        bottom={0}
        p={2}
        bgcolor='background.default'
      >
        <Button variant='outlined' color='primary' href={`/projects/${project.path}`} LinkComponent={Link}>
          Cancel
        </Button>
        <LoadingButton
          variant='contained'
          color='primary'
          onClick={onSubmit}
          loading={isExecuting}
          disabled={isExecuting || !isDirty}
          sx={{ width: 'fit-content' }}
        >
          Save
        </LoadingButton>
      </Stack>
    </>
  );
}
