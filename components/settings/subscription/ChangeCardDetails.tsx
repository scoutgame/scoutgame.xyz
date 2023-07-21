import { log } from '@charmverse/core/log';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import ConfirmModal from 'components/common/Modal/ConfirmModal';
import { useSnackbar } from 'hooks/useSnackbar';
import type { UpdatePaymentMethodRequest } from 'lib/subscription/updatePaymentMethod';

import { CardSection } from './CardSection';

export function ChangeCardDetails({
  spaceId,
  refetchSubscription
}: {
  spaceId: string;
  refetchSubscription: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { showMessage } = useSnackbar();
  const updatePaymentMethodPopup = usePopupState({ variant: 'popover', popupId: 'update-payment' });
  const [isDisabled, setIsDisabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { trigger: changePaymentMethod } = useSWRMutation(
    `/spaces/${spaceId}/payment-method`,
    (_url, { arg }: Readonly<{ arg: UpdatePaymentMethodRequest }>) =>
      charmClient.subscription.updatePaymentMethod(spaceId, arg),
    {
      onError() {
        showMessage('Changing payment details failed!', 'error');
        setIsProcessing(false);
      },
      onSuccess() {
        showMessage('Changing payment details has been successful!', 'success');
        refetchSubscription();
      }
    }
  );

  const handlePaymentMethodChange = async () => {
    if (!stripe || !elements) {
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    const cardExpiry = elements.getElement(CardExpiryElement);
    const cardCvc = elements.getElement(CardCvcElement);
    const cardError = !cardNumber || !cardExpiry || !cardCvc;

    if (cardError) {
      return;
    }

    setIsProcessing(true);

    const { error: createPaymentMethodError, paymentMethod: paymentMethodDetails } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumber
    });

    if (createPaymentMethodError) {
      showMessage('Payment failed! Please try again later.', 'error');
      log.error(`[stripe]: Failed creating a payment method. ${createPaymentMethodError.message}`, {
        errorType: createPaymentMethodError.type,
        errorCode: createPaymentMethodError.code
      });
      setIsProcessing(false);
      return;
    }
    await changePaymentMethod({ paymentMethodId: paymentMethodDetails.id });

    setIsProcessing(false);
  };

  const handleCardDetails = (disabled: boolean) => {
    setIsDisabled(disabled);
  };

  return (
    <>
      <Button {...bindTrigger(updatePaymentMethodPopup)} variant='text' sx={{ px: 0 }}>
        Update your payment details
      </Button>
      <ConfirmModal
        open={updatePaymentMethodPopup.isOpen}
        onClose={updatePaymentMethodPopup.close}
        onConfirm={handlePaymentMethodChange}
        buttonText='Update card'
        disabled={isDisabled || isProcessing}
        title='Update your credit card details'
        question={<CardSection disabled={isProcessing} handleCardDetails={handleCardDetails} />}
      />
    </>
  );
}
