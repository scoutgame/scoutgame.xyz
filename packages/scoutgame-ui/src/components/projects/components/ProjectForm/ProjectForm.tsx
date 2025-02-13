'use client';

import LoadingButton from '@mui/lab/LoadingButton';
import { Button, Divider, FormLabel, Stack, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { useMdScreen } from '../../../../hooks/useMediaScreens';
import { FormErrors } from '../../../common/FormErrors';
import { ProjectAvatarField } from '../../create/components/ProjectAvatarField';
import type { Deployer } from '../../create/components/ProjectSmartContractForm';
import { ProjectSmartContractForm } from '../../create/components/ProjectSmartContractForm';
import { ProjectTeamMemberForm } from '../../create/components/ProjectTeamMemberForm';

export function ProjectForm({
  control,
  isExecuting,
  onSave,
  isDirty,
  errors,
  deployers,
  setDeployers,
  cancelLink,
  showRemoveMemberConfirmation
}: {
  errors?: string[] | null;
  isDirty: boolean;
  isExecuting?: boolean;
  onSave: VoidFunction;
  control: Control<any>;
  deployers: Deployer[];
  setDeployers: React.Dispatch<React.SetStateAction<Deployer[]>>;
  cancelLink: string;
  showRemoveMemberConfirmation: boolean;
}) {
  const isMdScreen = useMdScreen();

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
            <ProjectAvatarField control={control} disabled={isExecuting} avatarSize={isMdScreen ? 150 : 100} />
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
                  placeholder='Example Project Title'
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
            <ProjectTeamMemberForm control={control} showRemoveMemberConfirmation={showRemoveMemberConfirmation} />
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
        <Button variant='outlined' color='primary' href={cancelLink} LinkComponent={Link}>
          Cancel
        </Button>
        <LoadingButton
          variant='contained'
          color='primary'
          onClick={onSave}
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
