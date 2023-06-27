import { yupResolver } from '@hookform/resolvers/yup';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import {
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import log from 'loglevel';
import type { FormEvent, SyntheticEvent } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Iframe from 'react-iframe';
import type { KeyedMutator } from 'swr';
import useSWRMutation from 'swr/mutation';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { SubscriptionPeriod } from 'lib/subscription/constants';
import { communityProduct, loopCheckoutUrl } from 'lib/subscription/constants';
import type { SpaceSubscriptionWithStripeData } from 'lib/subscription/getActiveSpaceSubscription';
import type { CreateCryptoSubscriptionRequest, SubscriptionPaymentIntent } from 'lib/subscription/interfaces';
import type { UpdateSubscriptionRequest } from 'lib/subscription/updateProSubscription';

import { LoadingSubscriptionSkeleton } from './LoadingSkeleton';
import type { PaymentType } from './PaymentTabs';
import PaymentTabs, { PaymentTabPanel } from './PaymentTabs';

const schema = () => {
  return yup
    .object({
      email: yup.string().email().required(),
      coupon: yup.string().optional()
    })
    .strict();
};

export function CheckoutForm({
  onCancel,
  refetch,
  handleCoupon,
  show,
  period,
  blockQuota,
  subscription,
  isLoading
}: {
  show: boolean;
  blockQuota: number;
  period: SubscriptionPeriod;
  subscription: SubscriptionPaymentIntent & { email?: string };
  isLoading: boolean;
  onCancel: VoidFunction;
  refetch: KeyedMutator<SpaceSubscriptionWithStripeData | null>;
  handleCoupon: (coupon: string | undefined) => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const {
    register,
    getValues,
    watch,
    formState: { errors }
  } = useForm<{ email: string; coupon: string }>({
    mode: 'onChange',
    defaultValues: {
      email: subscription.email || '',
      coupon: subscription.coupon || ''
    },
    resolver: yupResolver(schema())
  });

  const [paymentType, setPaymentType] = useState<PaymentType>('card');
  const [cryptoDrawerOpen, setCryptoDrawerOpen] = useState(false);

  const emailField = watch('email');
  const couponField = watch('coupon');

  const { space } = useCurrentSpace();
  const [isProcessing, setIsProcessing] = useState(false);
  const { showMessage } = useSnackbar();
  const [pendingPayment, setPendingPayment] = useState(false);

  const {
    data: checkoutUrl,
    trigger: createCryptoSubscription,
    isMutating: isLoadingCreateSubscriptionIntent
  } = useSWRMutation(
    `/api/spaces/${space?.id}/crypto-subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: CreateCryptoSubscriptionRequest } }>) =>
      charmClient.subscription.createCryptoSubscription(arg.spaceId, arg.payload),
    {
      onError(error) {
        showMessage('Payment failed! Please try again', 'error');
        log.error(`[stripe]: Payment failed. ${error.message}`, {
          errorType: error.type,
          errorCode: error.code
        });
        setCryptoDrawerOpen(false);
      },
      async onSuccess() {
        await refetch();
      }
    }
  );

  const { trigger: updateSpaceSubscription } = useSWRMutation(
    `/api/spaces/${space?.id}/subscription`,
    (_url, { arg }: Readonly<{ arg: { spaceId: string; payload: UpdateSubscriptionRequest } }>) =>
      charmClient.subscription.updateSpaceSubscription(arg.spaceId, arg.payload),
    {
      onError() {
        showMessage('Updating failed! Please try again', 'error');
      }
    }
  );

  const changePaymentType = (_event: SyntheticEvent, newValue: PaymentType) => {
    if (newValue !== null) {
      setPaymentType(newValue);
    }
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== loopCheckoutUrl) {
        return;
      }

      if (event?.type === 'message' && event?.data === 'CheckoutComplete') {
        setPendingPayment(true);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const emailError = errors.email || emailField.length === 0;

  const createSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!space || !stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const paymentDetails = getValues();

    const paymentErrorMetadata = {
      spaceId: space.id,
      period,
      email: paymentDetails.email
    };

    try {
      const { error } = await elements.submit();

      if (error || !paymentDetails.email) {
        return;
      }

      setIsProcessing(true);

      await updateSpaceSubscription({
        spaceId: space.id,
        payload: {
          billingEmail: paymentDetails.email,
          subscriptionId: subscription.subscriptionId
        }
      });

      const { error: confirmPaymentError } = await stripe.confirmPayment({
        elements,
        // There are some payment methods that require the user to open another page and then redirect back to the app
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.href}?subscription=true`,
          receipt_email: paymentDetails.email,
          payment_method_data: {
            billing_details: {
              email: paymentDetails.email
            }
          }
        }
      });

      if (confirmPaymentError) {
        showMessage('Payment failed! Please try again', 'error');
        log.error(`[stripe]: Failed to confirm payment. ${confirmPaymentError.message}`, {
          ...paymentErrorMetadata,
          errorType: confirmPaymentError.type,
          errorCode: confirmPaymentError.code
        });
      } else {
        showMessage('Payment successful! Community subscription active.', 'success');
      }
      onCancel();
    } catch (error: any) {
      showMessage('Payment failed! Please try again', 'error');
      log.error(`[stripe]: Payment failed. ${error.message}`, {
        ...paymentErrorMetadata,
        errorType: error.type,
        errorCode: error.code
      });
      onCancel();
    }

    setIsProcessing(false);
  };

  const startCryptoPayment = async () => {
    if (!space || !stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setCryptoDrawerOpen(true);

    const paymentDetails = getValues();
    await createCryptoSubscription({
      spaceId: space.id,
      payload: {
        subscriptionId: subscription.subscriptionId,
        email: paymentDetails.email
      }
    });
    setPendingPayment(true);
  };

  const price = period === 'annual' ? communityProduct.pricing.annual / 12 : communityProduct.pricing.monthly;

  return (
    <>
      {pendingPayment && (
        <Stack gap={1}>
          <Typography>Payment pending. Please revisit this page in a few minutes.</Typography>
        </Stack>
      )}
      <Stack maxWidth='400px'>
        <Typography variant='h6' mb={1}>
          Billing Information
        </Typography>
        <Stack gap={0.5} my={2}>
          <InputLabel>Email (required)</InputLabel>
          <TextField disabled={isProcessing} placeholder='johndoe@gmail.com' {...register('email')} />
        </Stack>
      </Stack>
      <Divider sx={{ mb: 1 }} />
      <Grid container gap={2} sx={{ flexWrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={8} onSubmit={createSubscription}>
          {isLoading && <LoadingSubscriptionSkeleton isLoading={isLoading} />}
          {!isLoading && show && (
            <>
              <PaymentTabs value={paymentType} onChange={changePaymentType} />
              <PaymentTabPanel value={paymentType} index='card'>
                <PaymentElement options={{ paymentMethodOrder: ['card', 'us_bank_account'] }} />
              </PaymentTabPanel>
              <PaymentTabPanel value={paymentType} index='crypto'>
                <Typography mb={1}>
                  We accept crypto payments through our partner Loop. After you click Upgrade a popup will appear with
                  instructions on finishing your payment.
                </Typography>
              </PaymentTabPanel>
            </>
          )}
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant='h6' mb={2}>
            Order Summary
          </Typography>
          <Stack display='flex' flexDirection='row' justifyContent='space-between'>
            <Stack>
              <Typography mb={1}>Community Edition</Typography>
              <Typography variant='body2'>Billed {period}</Typography>
            </Stack>
            <Stack>
              <Typography>${price * blockQuota}/mo</Typography>
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack gap={0.5} my={2}>
            <Typography>Coupon code</Typography>
            <Stack>
              <TextField
                disabled={isProcessing || !!subscription.coupon}
                {...register('coupon')}
                InputProps={{
                  ...(subscription.coupon
                    ? {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton onClick={() => handleCoupon(undefined)} disabled={isLoading}>
                              <CloseIcon />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    : {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              onClick={() => handleCoupon(getValues().coupon)}
                              disabled={isLoading || !couponField}
                            >
                              <SendIcon />
                            </IconButton>
                          </InputAdornment>
                        )
                      })
                }}
              />
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          {subscription.totalPrice !== subscription.subTotalPrice && (
            <>
              <Stack display='flex' flexDirection='row' justifyContent='space-between'>
                <Stack>
                  <Typography>Subtotal</Typography>
                </Stack>
                <Stack>
                  <Typography>${subscription.subTotalPrice || 0}</Typography>
                </Stack>
              </Stack>
              <Stack display='flex' flexDirection='row' justifyContent='space-between'>
                <Stack>
                  <Typography>Discount</Typography>
                </Stack>
                <Stack>
                  <Typography>${(subscription.subTotalPrice - subscription.totalPrice).toFixed(1)}</Typography>
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
            </>
          )}
          <Stack display='flex' flexDirection='row' justifyContent='space-between'>
            <Stack>
              <Typography>Total</Typography>
            </Stack>
            <Stack>
              <Typography>${subscription.totalPrice || 0}</Typography>
            </Stack>
          </Stack>
          <PaymentTabPanel value={paymentType} index='card'>
            <Stack gap={1} display='flex' flexDirection='column'>
              <Button
                onClick={createSubscription}
                loading={isProcessing}
                disabled={emailError || !emailField || isProcessing || !stripe || !elements || !space}
              >
                {isProcessing ? 'Processing ... ' : 'Upgrade'}
              </Button>
              <Button disabled={isProcessing} onClick={onCancel} color='secondary' variant='text'>
                Cancel
              </Button>
            </Stack>
          </PaymentTabPanel>
          <PaymentTabPanel value={paymentType} index='crypto'>
            <Stack gap={1} display='flex' flexDirection='column'>
              <Button onClick={() => startCryptoPayment()} disabled={!emailField || isProcessing}>
                Upgrade
              </Button>
              <Button disabled={isProcessing} onClick={onCancel} color='secondary' variant='text'>
                Cancel
              </Button>
            </Stack>
          </PaymentTabPanel>
        </Grid>
      </Grid>
      <Drawer
        anchor='right'
        open={cryptoDrawerOpen}
        onClose={() => {
          setCryptoDrawerOpen(false);
          onCancel();
        }}
        PaperProps={{
          sx: {
            width: {
              xs: '100%',
              sm: '600px'
            }
          }
        }}
      >
        <IconButton
          onClick={() => {
            setCryptoDrawerOpen(false);
            onCancel();
          }}
          size='small'
          sx={{ position: 'absolute', right: 5, top: 10, zIndex: 1 }}
        >
          <CloseIcon fontSize='small' />
        </IconButton>
        {checkoutUrl && <Iframe loading='lazy' url={checkoutUrl} position='relative' width='100%' height='100%' />}
        <LoadingComponent height='100%' isLoading={isLoadingCreateSubscriptionIntent} />
      </Drawer>
    </>
  );
}
