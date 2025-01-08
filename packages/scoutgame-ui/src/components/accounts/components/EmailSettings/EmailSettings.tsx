'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import { Check as CheckIcon } from '@mui/icons-material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { Button, Checkbox, FormControlLabel, Paper, Stack, TextField, Typography, Chip } from '@mui/material';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { updateUserEmailSettingsAction } from '@packages/users/updateUserEmailSettingsAction';
import type { UpdateUserEmailSettingsFormValues } from '@packages/users/updateUserEmailSettingsSchema';
import { updateUserEmailSettingsSchema } from '@packages/users/updateUserEmailSettingsSchema';
import { sendVerificationEmailAction } from '@packages/users/verifyEmailAction';
import { concatenateStringValues } from '@packages/utils/strings';
import { useAction } from 'next-safe-action/hooks';
import { useState, useCallback } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FormErrors } from '../../../common/FormErrors';
import type { UserWithAccountsDetails } from '../../AccountsPage';

export function EmailSettings({ user: { verifiedEmail, ...user } }: { user: UserWithAccountsDetails }) {
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
  const { execute: sendVerificationEmail, isExecuting: isSending } = useAction(sendVerificationEmailAction, {
    async onSuccess() {
      toast.success('Verification email sent! Please check your inbox.');
    },
    onError(error) {
      toast.error('Failed to send verification email');
      log.warn('Failed to send verification email', { error });
    }
  });

  const { execute, isExecuting } = useAction(updateUserEmailSettingsAction, {
    async onSuccess({ input, data }) {
      setErrors(null);
      reset(input);
      revalidatePathAction();
      if (data.verificationEmailSent) {
        toast.success('Verification email sent! Please check your inbox.');
      }
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

  async function handleVerifyEmail() {
    await sendVerificationEmail();
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Stack gap={1}>
          <Stack width={{ xs: '100%', md: 350 }} gap={2}>
            <Stack justifyContent='space-between' direction='row'>
              <Stack direction='row' gap={1} alignItems='center'>
                <EmailOutlinedIcon />
                <Typography variant='h6'>Email</Typography>
              </Stack>
              {user.email && !verifiedEmail && (
                <Chip
                  sx={{ ml: 2 }}
                  label={isSending ? 'Sending...' : 'Verify email'}
                  color='success'
                  variant='outlined'
                  onClick={handleVerifyEmail}
                  disabled={isSending || isDirty}
                />
              )}
              {user.email && verifiedEmail && (
                <Chip
                  sx={{ ml: 2 }}
                  label='Verified'
                  color='success'
                  variant='outlined'
                  icon={<CheckIcon fontSize='small' />}
                />
              )}
            </Stack>

            <Controller
              control={control}
              name='email'
              disabled={isExecuting}
              render={({ field, formState }) => <TextField fullWidth error={!!formState.errors.email} {...field} />}
            />
          </Stack>

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
