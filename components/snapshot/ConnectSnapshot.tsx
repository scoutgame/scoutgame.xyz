import { yupResolver } from '@hookform/resolvers/yup';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useWeb3React } from '@web3-react/core';
import FieldLabel from 'components/common/form/FieldLabel';
import PrimaryButton from 'components/common/PrimaryButton';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { getSnapshotSpace } from 'lib/snapshot/get-space';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';
import { isTruthy } from 'lib/utilities/types';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { SystemError } from 'lib/utilities/errors';
import { useState } from 'react';
import charmClient from 'charmClient';
import Alert from '@mui/material/Alert';

export const schema = yup.object({
  snapshotDomain: yup.string().required().test('checkDomain', 'Snapshot domain not found', async (domain) => {

    if (!domain || domain.length < 3) {
      return false;
    }

    const foundSpace = await getSnapshotSpace(domain);

    return isTruthy(foundSpace);

  }),
  defaultVotingDuration: yup.number().required()
});

export type FormValues = yup.InferType<typeof schema>;

const DEFAULT_VOTING_DURATION = 7;

export default function ConnectSnapshot () {

  const [space, setSpace] = useCurrentSpace();
  const [formError, setFormError] = useState<SystemError | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    defaultValues: {
      defaultVotingDuration: space?.defaultVotingDuration ?? DEFAULT_VOTING_DURATION,
      snapshotDomain: space?.snapshotDomain as any
    },
    resolver: yupResolver(schema),
    mode: 'onBlur'
  });

  const values = watch();

  async function onSubmit (formValues: FormValues) {

    setFormError(null);

    charmClient.updateSnapshotConnection(space?.id as any, formValues)
      .then((spaceWithDomain) => {
        setSpace(spaceWithDomain);
      })
      .catch(err => {
        setFormError(err);
      });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container direction='column' spacing={3}>
        <Grid item>
          <FieldLabel>Snapshot domain</FieldLabel>
          <TextField
            {...register('snapshotDomain')}
            fullWidth
            error={!!errors.snapshotDomain}
            helperText={errors.snapshotDomain?.message}
          />
        </Grid>
        {
          values.snapshotDomain && !errors.snapshotDomain && (
            <Grid item>
              <FieldLabel>Default voting duration (days)</FieldLabel>
              <TextField
                {...register('defaultVotingDuration')}
                fullWidth
                error={!!errors.defaultVotingDuration}
                helperText={errors.defaultVotingDuration?.message}
              />
            </Grid>
          )
        }

        {
          formError && (
            <Grid item>
              <Alert severity='error'>{formError.message ?? (formError as any).error}</Alert>
            </Grid>
          )
        }

        <Grid item display='flex' justifyContent='space-between'>
          <PrimaryButton disabled={!isValid} type='submit'>
            Save
          </PrimaryButton>
        </Grid>
      </Grid>
    </form>
  );
}
