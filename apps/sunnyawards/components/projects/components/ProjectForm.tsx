'use client';

import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import { MultiTextInputField } from '@connect-shared/components/common/MultiTextInputField';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { ConnectProjectDetails } from '@connect-shared/lib/projects/findProject';
import { FormLabel, MenuItem, Select, Stack, TextField, Typography, Button } from '@mui/material';
import { capitalize } from '@root/lib/utils/strings';
import Link from 'next/link';
import type { Control } from 'react-hook-form';
import { Controller, useController } from 'react-hook-form';

import type { FormValues } from 'lib/projects/form';
import { CATEGORIES, SUNNY_AWARD_CATEGORIES } from 'lib/projects/form';

import { AddProjectMembersForm } from './AddProjectMembersForm';
import { BlockchainSelect } from './BlockchainSelect';
import { FormErrors } from './FormErrors';
import { ProjectImageField } from './ProjectImageField';

export function ProjectForm({
  control,
  isExecuting,
  projectMembers = [],
  user,
  errors
}: {
  control: Control<FormValues>;
  projectMembers?: ConnectProjectDetails['projectMembers'];
  isExecuting: boolean;
  user: LoggedInUser;
  errors: string[] | null;
}) {
  const { field: sunnyAwardsProjectTypeField } = useController({ name: 'sunnyAwardsProjectType', control });

  const sunnyAwardsProjectType = sunnyAwardsProjectTypeField.value;

  return (
    <>
      <Stack mb={2}>
        <FormLabel id='project-avatar-and-cover-image'>Project avatar and cover image</FormLabel>
        <Stack direction='row' gap={1}>
          <ProjectImageField type='avatar' name='avatar' control={control} />
          <ProjectImageField type='cover' name='coverImage' control={control} />
        </Stack>
      </Stack>
      <Stack gap={2} mb={2}>
        <Stack>
          <FormLabel required id='project-name'>
            Name
          </FormLabel>
          <Controller
            control={control}
            name='name'
            render={({ field, fieldState }) => (
              <TextField
                data-test='project-form-name'
                autoFocus
                placeholder='Charmverse'
                aria-labelledby='project-name'
                {...field}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Stack>
        <Stack>
          <FormLabel required id='project-description'>
            Description
          </FormLabel>
          <Controller
            control={control}
            name='description'
            render={({ field, fieldState }) => (
              <TextField
                data-test='project-form-description'
                multiline
                rows={3}
                aria-labelledby='project-description'
                placeholder='A description of your project'
                {...field}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Stack>
        <Stack>
          <FormLabel id='project-sunnyaward-type' required>
            Sunny Awards Project Type
          </FormLabel>
          <Controller
            control={control}
            name='sunnyAwardsProjectType'
            render={({ field, fieldState }) => (
              <Select
                displayEmpty
                fullWidth
                aria-labelledby='project-sunny-category'
                data-test='project-sunny-category'
                renderValue={(value) =>
                  value ? capitalize(value) : <Typography color='secondary'>Select a category</Typography>
                }
                {...field}
                error={!!fieldState.error}
              >
                {SUNNY_AWARD_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {capitalize(category)}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </Stack>
        {sunnyAwardsProjectType === 'app' && (
          <Stack gap={2}>
            <Stack>
              <FormLabel id='project-chain' required>
                Project Chain
              </FormLabel>
              <Controller
                control={control}
                name='primaryContractChainId'
                render={({ field }) => <BlockchainSelect {...field} value={field.value} onChange={field.onChange} />}
              />
            </Stack>
            <Stack>
              <FormLabel id='project-contract' required>
                Project Contract Address
              </FormLabel>
              <Controller
                control={control}
                name='primaryContractAddress'
                render={({ field, fieldState }) => (
                  <TextField
                    data-test='project-contract'
                    rows={3}
                    aria-labelledby='project-contract'
                    placeholder='Contract address'
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Stack>
          </Stack>
        )}
        {sunnyAwardsProjectType === 'creator' && (
          <Stack>
            <FormLabel id='project-minting-wallet' required>
              Creator minting wallet address
            </FormLabel>
            <Controller
              control={control}
              name='mintingWalletAddress'
              render={({ field, fieldState }) => (
                <TextField
                  data-test='project-minting-wallet'
                  rows={3}
                  aria-labelledby='project-minting-wallet'
                  placeholder='Wallet used to mint the project'
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>
        )}
        <MultiTextInputField
          required
          control={control}
          name='websites'
          label='Websites'
          data-test='project-form-websites'
          placeholder='https://charmverse.io'
        />
        <Stack>
          <FormLabel id='project-category' required>
            Category
          </FormLabel>
          <Controller
            control={control}
            name='category'
            render={({ field, fieldState }) => (
              <Select
                displayEmpty
                fullWidth
                aria-labelledby='project-category'
                data-test='project-form-category'
                renderValue={(value) => value || <Typography color='secondary'>Select a category</Typography>}
                error={!!fieldState.error}
                {...field}
              >
                {CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </Stack>

        <MultiTextInputField
          control={control}
          name='farcasterValues'
          label='Farcaster'
          data-test='project-form-farcaster-values'
          placeholder='https://warpcast.com/charmverse'
        />

        <Stack>
          <FormLabel id='project-twitter'>X</FormLabel>
          <Stack direction='row' gap={1} alignItems='center'>
            <Typography color='secondary' width={250}>
              https://x.com/
            </Typography>
            <Controller
              control={control}
              name='twitter'
              render={({ field, fieldState }) => (
                <TextField
                  fullWidth
                  placeholder='charmverse'
                  data-test='project-form-twitter'
                  aria-labelledby='project-twitter'
                  error={!!fieldState.error}
                  {...field}
                />
              )}
            />
          </Stack>
        </Stack>
        <Stack>
          <FormLabel id='project-github'>Github</FormLabel>
          <Stack direction='row' gap={1} alignItems='center'>
            <Typography color='secondary' width={250}>
              https://github.com/
            </Typography>
            <Controller
              control={control}
              name='github'
              render={({ field, fieldState }) => (
                <TextField
                  fullWidth
                  placeholder='charmverse'
                  aria-labelledby='project-github'
                  data-test='project-form-github'
                  error={!!fieldState.error}
                  {...field}
                />
              )}
            />
          </Stack>
        </Stack>
      </Stack>
      <AddProjectMembersForm
        user={user}
        control={control}
        disabled={isExecuting}
        initialFarcasterProfiles={projectMembers.slice(1).map((member) => ({
          bio: member.farcasterUser.bio,
          displayName: member.farcasterUser.displayName,
          fid: member.farcasterUser.fid,
          pfpUrl: member.farcasterUser.pfpUrl,
          username: member.farcasterUser.username
        }))}
      />
      <Stack direction='row' justifyContent='space-between'>
        <Button LinkComponent={Link} href='/profile' variant='outlined' color='secondary'>
          Cancel
        </Button>
        <Stack direction='row' gap={1}>
          {isExecuting && (
            <LoadingComponent
              height={20}
              size={20}
              minHeight={20}
              label='Submitting your project onchain'
              flexDirection='row-reverse'
            />
          )}
          {!isExecuting && errors?.length && <FormErrors errors={errors} />}
          <Button data-test='project-form-publish' disabled={isExecuting} type='submit'>
            Publish
          </Button>
        </Stack>
      </Stack>
    </>
  );
}
