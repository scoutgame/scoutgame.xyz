import type { PaymentMethod } from '@charmverse/core/prisma';
import { Box, Stack, TextField } from '@mui/material';
import type { CryptoCurrency } from 'connectors/chains';
import { getChainById } from 'connectors/chains';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { SelectPreviewContainer } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { Button } from 'components/common/Button';
import { Dialog } from 'components/common/Dialog/Dialog';
import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import { RewardTokenSelect } from 'components/rewards/components/RewardProperties/components/RewardTokenSelect';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { RewardAmount } from '../../RewardStatusBadge';

export type RewardTokenDetails = {
  chainId: number;
  rewardToken: string;
  rewardAmount: number;
};

type Props = {
  onChange: (value: RewardTokenDetails | null) => void;
  currentReward: (RewardCreationData & RewardWithUsers) | null;
  readOnly?: boolean;
};

type FormInput = {
  chainId?: number;
  rewardAmount?: number;
  rewardToken?: string;
};

export function RewardTokenProperty({ onChange, currentReward, readOnly }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableCryptos, setAvailableCryptos] = useState<(string | CryptoCurrency)[]>(['ETH']);

  const [paymentMethods] = usePaymentMethods();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<FormInput>({
    defaultValues: {
      rewardToken: currentReward?.rewardToken || '',
      chainId: currentReward?.chainId || undefined,
      rewardAmount: currentReward?.rewardAmount || undefined
    }
  });

  const watchChainId = watch('chainId');

  const handleClose = () => {
    setIsOpen(false);
  };

  const onSubmit = (values: FormInput) => {
    onChange(values as RewardTokenDetails);
    handleClose();
  };

  function refreshCryptoList(chainId: number, rewardToken?: string) {
    // Set the default chain currency
    const selectedChain = getChainById(chainId);

    if (selectedChain) {
      const nativeCurrency = selectedChain.nativeCurrency.symbol;

      const cryptosToDisplay = [nativeCurrency];

      const contractAddresses = paymentMethods
        .filter((method) => method.chainId === chainId)
        .map((method) => {
          return method.contractAddress;
        })
        .filter(isTruthy);
      cryptosToDisplay.push(...contractAddresses);

      setAvailableCryptos(cryptosToDisplay);
      setValue('rewardToken', rewardToken || nativeCurrency);
    }
    return selectedChain?.nativeCurrency.symbol;
  }

  async function onNewPaymentMethod(paymentMethod: PaymentMethod) {
    if (paymentMethod.contractAddress) {
      refreshCryptoList(paymentMethod.chainId, paymentMethod.contractAddress);
    }
  }

  function openTokenSettings() {
    if (readOnly) {
      return;
    }
    setIsOpen(true);
    reset({
      rewardToken: currentReward?.rewardToken || '',
      chainId: currentReward?.chainId || undefined,
      rewardAmount: currentReward?.rewardAmount || undefined
    });
  }

  useEffect(() => {
    if (currentReward) {
      refreshCryptoList(currentReward.chainId || 1, currentReward.rewardToken || undefined);
    }
  }, [currentReward, reset]);

  useEffect(() => {
    if (watchChainId) {
      const newNativeCurrency = refreshCryptoList(watchChainId);
      setValue('rewardToken', newNativeCurrency);
    }
  }, [watchChainId]);

  if (!currentReward) {
    return null;
  }

  return (
    <>
      <SelectPreviewContainer readOnly={readOnly} displayType='details' onClick={openTokenSettings}>
        <Box>
          <RewardAmount
            reward={{
              chainId: currentReward.chainId,
              customReward: currentReward.customReward,
              rewardAmount: currentReward.rewardAmount,
              rewardToken: currentReward.rewardToken
            }}
            truncate={true}
            truncatePrecision={2}
            typographyProps={{ variant: 'body2', fontWeight: 'normal', fontSize: 'normal' }}
          />
        </Box>
      </SelectPreviewContainer>

      <Dialog
        open={isOpen}
        onClose={handleClose}
        title='Reward token details'
        footerActions={
          <Stack gap={2} flexDirection='row' alignItems='center'>
            <Button
              sx={{
                alignSelf: 'flex-start'
              }}
              onClick={handleClose}
              variant='outlined'
              color='secondary'
            >
              Cancel
            </Button>

            <Button
              disabled={!isValid}
              onClick={handleSubmit(onSubmit)}
              sx={{
                alignSelf: 'flex-start'
              }}
            >
              Save
            </Button>
          </Stack>
        }
      >
        <Stack flex={1} className='CardDetail content'>
          <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
            <PropertyLabel readOnly>Chain</PropertyLabel>
            <Controller
              name='chainId'
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange: _onChange, value } }) => (
                <InputSearchBlockchain
                  disabled={readOnly}
                  readOnly={readOnly}
                  chainId={value}
                  sx={{
                    width: '100%'
                  }}
                  onChange={_onChange}
                />
              )}
            />
          </Box>

          <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
            <PropertyLabel readOnly>Token</PropertyLabel>
            <Controller
              name='rewardToken'
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange: _onChange, value } }) => (
                <RewardTokenSelect
                  disabled={readOnly || !isTruthy(watchChainId)}
                  readOnly={readOnly}
                  cryptoList={availableCryptos}
                  chainId={currentReward?.chainId ?? watchChainId}
                  defaultValue={value ?? undefined}
                  value={value ?? undefined}
                  hideBackdrop={true}
                  onChange={_onChange}
                  onNewPaymentMethod={onNewPaymentMethod}
                  sx={{
                    width: '100%'
                  }}
                />
              )}
            />
          </Box>

          <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
            <PropertyLabel readOnly>Amount</PropertyLabel>
            <Controller
              name='rewardAmount'
              control={control}
              rules={{ required: true, validate: (value) => Number(value) > 0 }}
              render={({ field: { onChange: _onChange, value } }) => (
                <TextField
                  onChange={_onChange}
                  value={value ?? undefined}
                  data-test='reward-property-amount'
                  type='number'
                  inputProps={{
                    step: 0.01,
                    style: { height: 'auto' }
                  }}
                  sx={{
                    width: '100%'
                  }}
                  required
                  disabled={readOnly}
                  placeholder='Number greater than 0'
                  error={!!errors.rewardAmount}
                />
              )}
            />
          </Box>
        </Stack>
      </Dialog>
    </>
  );
}
