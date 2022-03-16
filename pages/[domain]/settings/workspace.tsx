import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import Button from 'components/common/Button';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import Legend from 'components/settings/Legend';
import Avatar from 'components/settings/LargeAvatar';
import { setTitle } from 'hooks/usePageTitle';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { FormValues, schema } from 'components/common/CreateSpaceForm';
import { useSpaces } from 'hooks/useSpaces';
import { useRouter } from 'next/router';
import { yupResolver } from '@hookform/resolvers/yup';
import charmClient from 'charmClient';
import { Box, Typography } from '@mui/material';
import { useUser } from 'hooks/useUser';
import { useTheme } from '@emotion/react';

export default function WorkspaceSettings () {

  setTitle('Workspace Options');
  const router = useRouter();
  const [space, setSpace] = useCurrentSpace();
  const [spaces] = useSpaces();
  const [user] = useUser();
  const theme = useTheme();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    defaultValues: space,
    resolver: yupResolver(schema)
  });

  const watchName = watch('name');

  async function onSubmit (values: FormValues) {
    if (!space) return;
    // reload with new subdomain
    const newDomain = space.domain !== values.domain;
    const updatedSpace = await charmClient.updateSpace({ ...space, ...values });
    if (newDomain) {
      window.location.href = router.asPath.replace(space.domain, values.domain);
    }
    else {
      setSpace(updatedSpace);
    }
    reset(updatedSpace);
  }

  async function deleteWorkspace () {
    if (space && window.confirm('Are you sure you want to delete your workspace? This action cannot be undone')) {
      await charmClient.deleteSpace(space!.id);
      const nextSpace = spaces.filter(s => s.id !== space.id)[0];
      window.location.href = nextSpace ? `/${nextSpace.domain}` : '/';
    }
  }

  return (
    <>
      <Legend>Space Details</Legend>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <Avatar name={watchName} variant='rounded' />
          </Grid>
          <Grid item>
            <FieldLabel>Name</FieldLabel>
            <TextField
              {...register('name')}
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item>
            <FieldLabel>Domain</FieldLabel>
            <TextField
              {...register('domain')}
              fullWidth
              error={!!errors.domain}
              helperText={errors.domain?.message}
            />
          </Grid>
          <Grid item display='flex' justifyContent='space-between'>
            <PrimaryButton disabled={!isDirty} type='submit'>
              Save
            </PrimaryButton>
            <Button variant='outlined' color='error' onClick={deleteWorkspace}>
              Delete Workspace
            </Button>
          </Grid>
        </Grid>
      </form>
      <Legend>Import</Legend>
      <Box sx={{ ml: 1 }}>
        <Button
          onClick={async () => {
            const { redirectUrl } = await charmClient.notionLogin({
              spaceId: space!.id,
              redirect: window.location.href,
              account: user?.addresses[0] ?? ''
            });
            window.location.replace(redirectUrl);
          }}
          variant='outlined'
          startIcon={(
            <svg xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' width='25' height='25' viewBox='0 0 50 50' version='1.1'>
              <g id='surface1'>
                <path style={{ stroke: 'none', fillRule: 'evenodd', fill: theme.palette.mode === 'dark' ? 'rgb(241, 241, 241)' : 'rgb(0%,0%,0%)', fillOpacity: 1 }} d='M 9.371094 8.898438 C 10.917969 10.15625 11.496094 10.058594 14.402344 9.867188 L 41.792969 8.222656 C 42.371094 8.222656 41.890625 7.640625 41.695312 7.542969 L 37.148438 4.257812 C 36.277344 3.578125 35.113281 2.804688 32.890625 3 L 6.367188 4.933594 C 5.398438 5.027344 5.207031 5.511719 5.59375 5.898438 Z M 11.015625 15.28125 L 11.015625 44.101562 C 11.015625 45.648438 11.789062 46.226562 13.53125 46.132812 L 43.632812 44.390625 C 45.375 44.292969 45.566406 43.230469 45.566406 41.972656 L 45.566406 13.347656 C 45.566406 12.089844 45.085938 11.414062 44.019531 11.507812 L 12.5625 13.347656 C 11.402344 13.445312 11.015625 14.023438 11.015625 15.28125 Z M 40.730469 16.828125 C 40.921875 17.699219 40.730469 18.570312 39.855469 18.667969 L 38.40625 18.957031 L 38.40625 40.230469 C 37.148438 40.90625 35.984375 41.296875 35.019531 41.296875 C 33.46875 41.296875 33.082031 40.8125 31.921875 39.363281 L 22.433594 24.46875 L 22.433594 38.878906 L 25.4375 39.554688 C 25.4375 39.554688 25.4375 41.296875 23.015625 41.296875 L 16.335938 41.683594 C 16.144531 41.296875 16.335938 40.328125 17.015625 40.136719 L 18.757812 39.652344 L 18.757812 20.601562 L 16.335938 20.40625 C 16.144531 19.535156 16.625 18.277344 17.984375 18.179688 L 25.144531 17.699219 L 35.019531 32.785156 L 35.019531 19.4375 L 32.5 19.148438 C 32.308594 18.085938 33.082031 17.3125 34.050781 17.214844 Z M 4.140625 2.320312 L 31.726562 0.289062 C 35.113281 0 35.988281 0.195312 38.117188 1.742188 L 46.921875 7.929688 C 48.375 8.996094 48.859375 9.285156 48.859375 10.445312 L 48.859375 44.390625 C 48.859375 46.519531 48.082031 47.777344 45.375 47.96875 L 13.339844 49.902344 C 11.304688 50 10.335938 49.710938 9.269531 48.355469 L 2.785156 39.941406 C 1.625 38.394531 1.140625 37.234375 1.140625 35.878906 L 1.140625 5.707031 C 1.140625 3.964844 1.917969 2.515625 4.140625 2.320312 Z M 4.140625 2.320312 ' />
              </g>
            </svg>
          )}
        >
          <Typography
            variant='h6'
            sx={{
              fontWeight: 'bold'
            }}
          >
            NOTION WORKSPACE
          </Typography>
        </Button>
      </Box>
    </>
  );

}

WorkspaceSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
