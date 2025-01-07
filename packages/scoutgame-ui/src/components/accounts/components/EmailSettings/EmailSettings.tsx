'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { Button, Checkbox, FormControlLabel, Paper, Stack, TextField, Typography } from '@mui/material';
import { updateUserEmailSettingsAction } from '@packages/users/updateUserEmailSettings';
import type { UpdateUserEmailSettingsFormValues } from '@packages/users/updateUserEmailSettingsSchema';
import { updateUserEmailSettingsSchema } from '@packages/users/updateUserEmailSettingsSchema';
import { concatenateStringValues } from '@packages/utils/strings';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';

import { FormErrors } from '../../../common/FormErrors';
import type { UserWithAccountsDetails } from '../../AccountsPage';

export function EmailSettings({ user }: { user: UserWithAccountsDetails }) {
  const [errors, setErrors] = useState<string[] | null>(null);
  const {
    control,
    getValues,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm<UpdateUserEmailSettingsFormValues>({
    resolver: yupResolver(updateUserEmailSettingsSchema),
    mode: 'onChange',
    defaultValues: {
      email: user.email,
      sendTransactionEmails: user.sendTransactionEmails,
      sendMarketing: user.sendMarketing
    }
  });

  const { execute, isExecuting } = useAction(updateUserEmailSettingsAction, {
    async onSuccess({ input }) {
      setErrors(null);
      reset(input);
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

  const onSubmit = (data: UpdateUserEmailSettingsFormValues) => {
    execute(data);
  };

  function onInvalid(fieldErrors: FieldErrors) {
    setErrors(['The form is invalid. Please check the fields and try again.']);
    log.warn('Invalid form submission', { fieldErrors, values: getValues() });
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Stack gap={1}>
          <Stack direction='row' gap={1} alignItems='center'>
            <EmailOutlinedIcon />
            <Typography variant='h6'>Email</Typography>
          </Stack>

          <Controller
            control={control}
            name='email'
            disabled={isExecuting}
            render={({ field, formState }) => (
              <TextField
                error={!!formState.errors.email}
                {...field}
                sx={{
                  maxWidth: {
                    xs: '100%',
                    md: 250
                  }
                }}
              />
            )}
          />

          <Stack gap={{ xs: 1, md: 0 }}>
            <Controller
              control={control}
              name='sendTransactionEmails'
              render={({ field }) => (
                <FormControlLabel
                  disabled={isExecuting}
                  control={<Checkbox checked={field.value} {...field} sx={{ alignSelf: 'flex-start' }} />}
                  label='Disable all Scout Game email notifications (activity and pending actions)'
                />
              )}
            />
            <Controller
              control={control}
              name='sendMarketing'
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} {...field} sx={{ alignSelf: 'flex-start' }} />}
                  label='Notify me of new opportunities (grants, accelerators, etc)'
                />
              )}
            />
          </Stack>
          <Button
            variant='contained'
            color='primary'
            type='submit'
            disabled={isExecuting || !isDirty}
            sx={{ width: 'fit-content' }}
          >
            Save
          </Button>
          <FormErrors errors={errors} />
        </Stack>
      </form>
    </Paper>
  );
}
