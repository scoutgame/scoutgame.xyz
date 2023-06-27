import type { Space } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { Divider, Grid, Stack, TextField, Typography } from '@mui/material';
import Chip from '@mui/material/Chip';
import InputLabel from '@mui/material/InputLabel';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import useSWRMutation from 'swr/mutation';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Legend from 'components/settings/Legend';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUserPreferences } from 'hooks/useUserPreferences';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import { communityProduct } from 'lib/subscription/constants';
import type { SpaceSubscriptionWithStripeData } from 'lib/subscription/getActiveSpaceSubscription';
import type { UpdateSubscriptionRequest } from 'lib/subscription/updateProSubscription';
import { formatDate, getTimeDifference } from 'lib/utilities/dates';

import { PaymentMethod } from './PaymentMethod';
import { SubscriptionActions } from './SubscriptionActions';

const schema = () => {
  return yup
    .object({
      email: yup.string().email().required()
    })
    .strict();
};

export function SubscriptionInformation({
  space,
  spaceSubscription,
  refetchSpaceSubscription
}: {
  space: Space;
  spaceSubscription: SpaceSubscriptionWithStripeData;
  refetchSpaceSubscription: () => Promise<SpaceSubscriptionWithStripeData | null | undefined>;
}) {
  const { showMessage } = useSnackbar();
  const { refreshCurrentSpace } = useCurrentSpace();
  const [showConfirmFreeDowngradeDialog, setShowConfirmFreeDowngradeDialog] = useState(false);
  const { userPreferences } = useUserPreferences();

  const {
    register,
    getValues,
    watch,
    formState: { errors }
  } = useForm<{ email: string }>({
    mode: 'onChange',
    defaultValues: { email: spaceSubscription.billingEmail ?? '' },
    resolver: yupResolver(schema())
  });
  const email = watch('email');

  const { subscribe } = useWebSocketClient();

  useEffect(() => {
    const unsubscribe = subscribe('space_subscription', async () => {
      await refetchSpaceSubscription().catch();
      await refreshCurrentSpace();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const { trigger: updateSpaceSubscription, isMutating: isLoadingUpdate } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: UpdateSubscriptionRequest } }>) =>
      charmClient.subscription.updateSpaceSubscription(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Updating failed! Please try again', 'error');
      },
      async onSuccess() {
        await refetchSpaceSubscription();
      }
    }
  );

  const { trigger: deleteSubscription, isMutating: isLoadingDeletion } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription-intent`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string } }>) =>
      charmClient.subscription.deleteSpaceSubscription(arg.spaceId),
    {
      onError() {
        showMessage('Deletion failed! Please try again', 'error');
      },
      async onSuccess() {
        await refetchSpaceSubscription();
      }
    }
  );

  async function handleDeleteSubs() {
    await deleteSubscription({ spaceId: space.id });
  }

  const status = useMemo(() => {
    switch (spaceSubscription?.status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending';
      case 'cancel_at_end':
        return 'Your subscription was cancelled and will end on the next billing date';
      case 'cancelled':
      default:
        return null;
    }
  }, [spaceSubscription?.status]);

  const price =
    spaceSubscription.period === 'annual' ? communityProduct.pricing.annual / 12 : communityProduct.pricing.monthly;

  const freeTrialEnds =
    spaceSubscription.status === 'free_trial'
      ? getTimeDifference(spaceSubscription?.expiresOn ?? new Date(), 'day', new Date())
      : undefined;
  const freeTrialLabel =
    spaceSubscription.status === 'free_trial'
      ? (freeTrialEnds as number) > 0
        ? `Free trial - ${freeTrialEnds} days left`
        : `Free trial finished`
      : '';

  const nextBillingDate = spaceSubscription?.renewalDate
    ? formatDate(spaceSubscription.renewalDate, { withYear: true, month: 'long' }, userPreferences.locale)
    : null;
  return (
    <>
      <Legend whiteSpace='normal'>Plan & Billing</Legend>
      <Grid container spacing={5} alignItems='center'>
        <Grid item xs={12} sm={8} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
          <Typography variant='h6' mb={1}>
            Current plan
            {spaceSubscription.status === 'free_trial' && (
              <Chip
                sx={{ ml: 2 }}
                size='small'
                color={(freeTrialEnds as number) > 0 ? 'green' : 'orange'}
                label={freeTrialLabel}
              />
            )}
          </Typography>
          <Typography>Community Edition - {String(spaceSubscription.blockQuota)}K blocks</Typography>

          <Typography>
            ${price * spaceSubscription.blockQuota} per month billed {spaceSubscription.period}
          </Typography>
          {nextBillingDate && (
            <Typography>
              {spaceSubscription.status === 'free_trial' ? 'First payment' : 'Renews'} on {nextBillingDate}
            </Typography>
          )}
          {status && <Typography>Status: {status}</Typography>}
        </Grid>
        <Grid item xs={12} sm={4}>
          <SubscriptionActions
            paidTier={space.paidTier}
            spaceSubscription={spaceSubscription}
            loading={isLoadingUpdate || isLoadingDeletion}
            onDelete={handleDeleteSubs}
            onCancelAtEnd={() => updateSpaceSubscription({ spaceId: space.id, payload: { status: 'cancel_at_end' } })}
            onReactivation={() => updateSpaceSubscription({ spaceId: space.id, payload: { status: 'active' } })}
            confirmFreeTierDowngrade={() => {
              charmClient.subscription
                .switchToFreeTier(space.id)
                .catch((err) => showMessage(err.message ?? 'Something went wrong', 'error'));
            }}
          />
        </Grid>
      </Grid>
      <Divider sx={{ my: 2 }} />
      {spaceSubscription?.paymentMethod && (
        <>
          <PaymentMethod paymentMethod={spaceSubscription.paymentMethod} />
          <Divider sx={{ my: 2 }} />
        </>
      )}
      <Grid container alignItems='center'>
        <Grid item xs={12} sm={6}>
          <Typography variant='h6' mb={1}>
            Billing Information
          </Typography>
          <Stack gap={0.5} my={2}>
            <InputLabel>Email</InputLabel>
            <TextField
              error={!!errors.email}
              disabled={isLoadingUpdate}
              placeholder='johndoe@gmail.com'
              {...register('email')}
            />
            <Button
              disabled={isLoadingUpdate || email.length === 0 || !!errors.email}
              onClick={() =>
                updateSpaceSubscription({ spaceId: space.id, payload: { billingEmail: getValues().email } })
              }
              sx={{ maxWidth: '100px', mt: 2 }}
              fullWidth={false}
            >
              Update
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={6} />
      </Grid>
    </>
  );
}
