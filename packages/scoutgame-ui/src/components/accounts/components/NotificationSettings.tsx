'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { LoadingButton } from '@mui/lab';
import { Checkbox, FormControlLabel, Paper, Stack, Typography } from '@mui/material';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { updateUserNotificationSettingsAction } from '@packages/users/updateUserNotificationSettingsAction';
import {
  type UpdateUserNotificationSettingsFormValues,
  updateUserNotificationSettingsSchema
} from '@packages/users/updateUserNotificationSettingsSchema';
import { concatenateStringValues } from '@packages/utils/strings';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';

import { FormErrors } from '../../common/FormErrors';
import type { UserWithAccountsDetails } from '../AccountsPage';

export function NotificationSettings({ user }: { user: UserWithAccountsDetails }) {
  const [errors, setErrors] = useState<string[] | null>(null);
  const {
    control,
    getValues,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm<UpdateUserNotificationSettingsFormValues>({
    resolver: yupResolver(updateUserNotificationSettingsSchema),
    mode: 'onChange',
    defaultValues: {
      emailNotification: user.emailNotification,
      farcasterNotification: user.farcasterNotification
    }
  });

  const { execute, isExecuting } = useAction(updateUserNotificationSettingsAction, {
    async onSuccess({ input }) {
      setErrors(null);
      reset(input);
      revalidatePathAction();
    },
    onError(err) {
      const hasValidationErrors = err.error.validationErrors?.fieldErrors;
      const errorMessage = hasValidationErrors
        ? concatenateStringValues(err.error.validationErrors!.fieldErrors)
        : err.error.serverError?.message || (err.error.serverError as any)?.message || 'Something went wrong';

      setErrors(errorMessage instanceof Array ? errorMessage : [errorMessage]);
      log.error('Error saving email settings', { error: err });
    }
  });

  const onSubmit = (data: UpdateUserNotificationSettingsFormValues) => {
    execute(data);
  };

  function onInvalid(fieldErrors: FieldErrors) {
    setErrors(['The form is invalid. Please check the fields and try again.']);
    log.warn('Invalid form submission', { fieldErrors, values: getValues() });
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Stack gap={2}>
          <Stack direction='row' gap={1} alignItems='center'>
            <NotificationsNoneOutlinedIcon />
            <Typography variant='h6'>Notifications</Typography>
          </Stack>
          <Stack gap={{ xs: 1, md: 0 }}>
            <Controller
              control={control}
              name='emailNotification'
              render={({ field }) => (
                <FormControlLabel
                  disabled={isExecuting}
                  control={<Checkbox checked={field.value} {...field} sx={{ alignSelf: 'flex-start' }} />}
                  label='Enable email notifications'
                />
              )}
            />
            <Controller
              control={control}
              name='farcasterNotification'
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} {...field} sx={{ alignSelf: 'flex-start' }} />}
                  label='Enable Farcaster notifications'
                />
              )}
            />
          </Stack>
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
          <FormErrors errors={errors} />
        </Stack>
      </form>
    </Paper>
  );
}
