'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import { Check as CheckIcon, Send as SendIcon } from '@mui/icons-material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { Button, Box, Checkbox, Chip, FormControlLabel, Paper, Stack, TextField, Typography } from '@mui/material';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { updateUserEmailSettingsAction } from '@packages/users/updateUserEmailSettingsAction';
import type { UpdateUserEmailSettingsFormValues } from '@packages/users/updateUserEmailSettingsSchema';
import { updateUserEmailSettingsSchema } from '@packages/users/updateUserEmailSettingsSchema';
import { sendVerificationEmailAction } from '@packages/users/verifyEmailAction';
import { concatenateStringValues } from '@packages/utils/strings';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
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
      if (data?.verificationEmailSent) {
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
        <Stack gap={2}>
          <Stack maxWidth={{ xs: '100%', md: 500 }} gap={2}>
            <Stack direction='row' gap={1} alignItems='center'>
              <EmailOutlinedIcon />
              <Typography variant='h6'>Email</Typography>
            </Stack>
            <Stack alignItems={{ xs: 'flex-start', md: 'center' }} direction={{ xs: 'column', md: 'row' }} gap={2}>
              <Controller
                control={control}
                name='email'
                disabled={isExecuting}
                render={({ field, formState }) => <TextField fullWidth error={!!formState.errors.email} {...field} />}
              />
              {!isDirty && user.email && !verifiedEmail && (
                <Chip
                  label={isSending ? 'Sending...' : 'Verify email'}
                  color='primary'
                  onClick={handleVerifyEmail}
                  disabled={isSending}
                  sx={{ px: 1 }}
                  icon={
                    <Box display='flex' alignItems='center'>
                      <SendIcon fontSize='small' />
                    </Box>
                  }
                />
              )}
              {!isDirty && user.email && verifiedEmail && (
                <Chip label='Verified' color='success' variant='outlined' icon={<CheckIcon fontSize='small' />} />
              )}
              {isDirty && <Chip label='Unverified' color={'grey' as any} variant='outlined' />}
            </Stack>
          </Stack>

          <Stack gap={{ xs: 1, md: 0 }}>
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
            loading={isExecuting}
            disabled={isExecuting || !isDirty}
            sx={{ width: 'fit-content' }}
          >
            Save{verifiedEmail ? '' : ' and verify'}
          </Button>
          <FormErrors errors={errors} />
        </Stack>
      </form>
    </Paper>
  );
}
