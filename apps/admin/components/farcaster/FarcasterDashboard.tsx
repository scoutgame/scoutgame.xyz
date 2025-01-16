'use client';

import { log } from '@charmverse/core/log';
import { Add as AddIcon, Clear as ClearIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useAction } from 'next-safe-action/hooks';
import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useSearchUsers } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type {
  AccountId,
  SuccessResponse,
  APIErrorResponse,
  InvalidInputResponse
} from 'lib/farcaster/sendMessagesAction';
import { sendMessagesAction } from 'lib/farcaster/sendMessagesAction';
import type { SortField, SortOrder } from 'lib/users/getUsers';

type FarcasterFormInputs = {
  messageContent: string;
  recipients: string;
  accountId: string;
};

// Only expose account IDs and names to the client
const FARCASTER_ACCOUNTS = [
  { id: 'chris', name: '@noun839.eth' },
  { id: 'scout', name: '@scoutgamexyz' }
] as const;

function getRecipients(value: string) {
  return value
    .split(/[\s,]+/)
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

export function FarcasterDashboard({ defaultAccount }: { defaultAccount?: AccountId }) {
  const {
    register,
    reset,
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<FarcasterFormInputs>({
    defaultValues: {
      accountId: defaultAccount,
      recipients: ''
    }
  });

  const { executeAsync: sendMessages, hasErrored, isExecuting: isSending, result } = useAction(sendMessagesAction);

  const recipientsValue = watch('recipients');
  const recipientsCount = useMemo(() => {
    return getRecipients(recipientsValue).length;
  }, [recipientsValue]);

  const onSubmit = async (data: FarcasterFormInputs) => {
    const recipients = getRecipients(data.recipients);

    log.info('Sending message to:', recipients);

    await sendMessages({
      message: data.messageContent,
      recipients,
      accountId: data.accountId as (typeof FARCASTER_ACCOUNTS)[number]['id']
    });
  };

  return (
    <Container maxWidth='xl'>
      <Stack spacing={3} sx={{ width: { xs: '100%', lg: '50%' } }}>
        <Typography variant='h5'>Farcaster Bulk Message Sender</Typography>

        <Paper sx={{ p: 3 }}>
          <Typography variant='subtitle1' gutterBottom>
            Send messages from a Farcaster account
          </Typography>
          <br />
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              {/* Account Selector */}
              <Controller
                name='accountId'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Send from Account</InputLabel>
                    <Select {...field} label='Send from Account'>
                      {FARCASTER_ACCOUNTS.map((account) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <TextField
                label='Message Content'
                multiline
                autoFocus
                required
                rows={4}
                fullWidth
                placeholder='Enter the message you want to send...'
                {...register('messageContent', { required: 'Message content is required' })}
                error={!!errors.messageContent}
                helperText={errors.messageContent?.message}
              />

              <Box>
                <TextField
                  label='Recipients'
                  multiline
                  required
                  rows={4}
                  fullWidth
                  placeholder='Enter Farcaster usernames (comma or space separated)'
                  helperText={errors.recipients?.message || 'Paste multiple addresses, comma or space separated'}
                  {...register('recipients', { required: 'Recipients are required' })}
                  error={!!errors.recipients}
                />
              </Box>

              <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
                <Box>
                  {isAPIErrorResponse(result.data) && (
                    <Typography variant='subtitle1' color='error'>
                      Error sending messages: {result.data!.error}
                    </Typography>
                  )}
                  {isInvalidInputResponse(result.data) && (
                    <Typography variant='subtitle1' color='error'>
                      Message not sent. Some recipients were invalid: {result.data!.invalidRecipients.join(', ')}
                    </Typography>
                  )}
                  {hasErrored && (
                    <Typography variant='subtitle1' color='error'>
                      Something went wrong
                    </Typography>
                  )}
                  {isSuccessResponse(result.data) && (
                    <Typography variant='subtitle1' color='success'>
                      {result.data.sent} message(s) sent successfully
                    </Typography>
                  )}
                </Box>
                <Box display='flex' justifyContent='flex-end' gap={2}>
                  <LoadingButton variant='outlined' onClick={() => reset()}>
                    Clear
                  </LoadingButton>
                  <LoadingButton
                    loading={isSending}
                    disabled={!isValid}
                    type='submit'
                    color='primary'
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                  >
                    Send {recipientsCount || ''} Message{recipientsCount && recipientsCount > 1 ? 's' : ''}
                  </LoadingButton>
                </Box>
              </Box>
            </Stack>
          </form>

          {isAPIErrorResponse(result.data) && (
            <Box pt={2}>
              <Typography variant='subtitle1' sx={{ mb: 2 }}>
                {result.data.sentRecipients.length} messages were successfully sent. The following recipients failed:
              </Typography>
              <TextField label='Failed recipients' value={result.data?.unsentRecipients} multiline rows={4} fullWidth />
            </Box>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}

export function isSuccessResponse(response: any): response is SuccessResponse {
  return response?.type === 'success';
}

export function isInvalidInputResponse(response: any): response is InvalidInputResponse {
  return response?.type === 'invalid_input';
}

export function isAPIErrorResponse(response: any): response is APIErrorResponse {
  return response?.type === 'warpcast_error';
}
