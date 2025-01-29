'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import LoadingButton from '@mui/lab/LoadingButton';
import { Button, Divider, FormLabel, Stack, TextField, Typography } from '@mui/material';
import type { SessionUser } from '@packages/nextjs/session/interfaces';
import { createScoutProjectAction } from '@packages/scoutgame/projects/createScoutProjectAction';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { createScoutProjectSchema } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';

import { useMdScreen } from '../../../hooks/useMediaScreens';
import { FormErrors } from '../../common/FormErrors';

import { ProjectAvatarField } from './ProjectAvatarField';
import type { Deployer } from './ProjectSmartContractForm';
import { ProjectSmartContractForm } from './ProjectSmartContractForm';
import { ProjectTeamMemberForm } from './ProjectTeamMemberForm';

export function CreateProjectForm({ user }: { user: SessionUser }) {
  const isMdScreen = useMdScreen();
  const [errors, setErrors] = useState<string[] | null>(null);
  const [deployers, setDeployers] = useState<Deployer[]>([]);

  const {
    control,
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
      github: '',
      teamMembers: [{ scoutId: user.id, role: 'owner', avatar: user.avatar ?? '', displayName: user.displayName }],
      contracts: [],
      deployers: []
    }
  });

  const router = useRouter();

  const { execute: createProject, isExecuting } = useAction(createScoutProjectAction, {
    onSuccess: (data) => {
      if (data?.data) {
        router.push(`/projects/${data?.data.path}`);
      }
    }
  });

  function onInvalid(fieldErrors: FieldErrors) {
    setErrors(['The form is invalid. Please check the fields and try again.']);
    log.warn('Invalid form submission', { fieldErrors });
  }

  const onSubmit = (data: CreateScoutProjectFormValues) => {
    createProject({
      ...data,
      deployers: deployers
        .filter((deployer) => deployer.signature && deployer.verified)
        .map((deployer) => ({
          address: deployer.address,
          signature: deployer.signature as `0x${string}`
        }))
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
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
        <Stack gap={3}>
          <Stack gap={1}>
            <Typography color='secondary' variant='h6'>
              Smart Contracts
            </Typography>
            <Typography lineHeight={2}>
              Add your smart contracts to earn additional gems and to participate in partner rewards, such as the Taiko
              AI challenge.
              <br />
              Sign a message with the wallet that deployed your contracts to prove ownership.
            </Typography>
            <ProjectSmartContractForm control={control} deployers={deployers} setDeployers={setDeployers} />
          </Stack>
        </Stack>
        <Divider />
        <Stack gap={3}>
          <Stack gap={1}>
            <Typography color='secondary' variant='h6'>
              Team
            </Typography>
            <Typography>Split Project Based Rewards with your teammates.</Typography>
            <ProjectTeamMemberForm control={control} />
          </Stack>
        </Stack>
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
        <Button
          variant='outlined'
          color='primary'
          onClick={() => {
            router.push('/projects');
          }}
        >
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
    </form>
  );
}
