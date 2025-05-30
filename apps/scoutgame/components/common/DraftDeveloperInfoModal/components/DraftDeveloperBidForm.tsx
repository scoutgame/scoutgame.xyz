'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import type { EvmTransaction } from '@decent.xyz/box-common';
import { BoxHooksContextProvider } from '@decent.xyz/box-hooks';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { WalletLogin } from '@packages/scoutgame-ui/components/common/WalletLogin/WalletLogin';
import { useUserWalletAddress } from '@packages/scoutgame-ui/hooks/api/session';
import { useDebouncedValue } from '@packages/scoutgame-ui/hooks/useDebouncedValue';
import { DRAFT_BID_RECIPIENT_ADDRESS, MIN_DEV_BID, useDraft } from '@packages/scoutgame-ui/providers/DraftProvider';
import { ceilToPrecision } from '@packages/utils/numbers';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { formatUnits, parseUnits } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';

import { DEV_PAYMENT_OPTION, PaymentTokenSelector, TOKEN_LOGO_RECORD } from 'components/common/PaymentTokenSelector';
import type { SelectedPaymentOption } from 'components/common/PaymentTokenSelector';
import { useGetTokenBalances } from 'hooks/useGetTokenBalances';

import { ERC20ApproveButton } from '../../NFTPurchaseDialog/components/ERC20Approve';
import { useGetERC20Allowance } from '../../NFTPurchaseDialog/hooks/useGetERC20Allowance';
import { useDecentV4Transaction } from '../hooks/useDecentV4Transaction';

export function DraftDeveloperBidForm({ onCancel, developerId }: { onCancel: () => void; developerId: string }) {
  const { address } = useAccount();

  if (!address) {
    return <WalletLogin color='secondary' />;
  }

  return (
    <BoxHooksContextProvider apiKey={env('DECENT_API_KEY')}>
      <DraftDeveloperBidFormComponent address={address} onCancel={onCancel} developerId={developerId} />
    </BoxHooksContextProvider>
  );
}

function DraftDeveloperBidFormComponent({
  address,
  onCancel,
  developerId
}: {
  address: Address;
  onCancel: () => void;
  developerId: string;
}) {
  const [bidAmount, setBidAmount] = useState(MIN_DEV_BID.toString());
  const debouncedBidAmount = useDebouncedValue(bidAmount, 500);
  const [customError, setCustomError] = useState<string | null>(null);
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { sendDraftTransaction, isSavingDraftTransaction, draftError, sendDevTransaction } = useDraft();
  const { error: addressError } = useUserWalletAddress(address);
  const [isConfirmingBid, setIsConfirmingBid] = useState(false);

  // Default to DEV token payment option
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>({
    ...DEV_PAYMENT_OPTION
  });

  const { tokens, isLoading: isLoadingTokenBalances } = useGetTokenBalances({
    address
  });

  const { selectedTokenBalance } = useMemo(() => {
    const _selectedPaymentOption = tokens?.find(
      (token) =>
        token.address.toLowerCase() === selectedPaymentOption.address.toLowerCase() &&
        token.chainId === selectedPaymentOption.chainId
    );

    return {
      selectedTokenBalance: _selectedPaymentOption?.balance
    };
  }, [tokens, selectedPaymentOption]);

  const { decentSdkError, isLoadingDecentSdk, decentTransactionInfo } = useDecentV4Transaction({
    address,
    receiverAddress: DRAFT_BID_RECIPIENT_ADDRESS,
    sourceChainId: selectedPaymentOption.chainId,
    sourceToken: selectedPaymentOption.address,
    enabled: !!(selectedPaymentOption.currency !== 'DEV' && selectedTokenBalance),
    amount: parseUnits(bidAmount, 18)
  });

  const tokenPaymentValue =
    decentTransactionInfo && 'tokenPayment' in decentTransactionInfo
      ? BigInt((decentTransactionInfo.tokenPayment?.amount?.toString() ?? '0').replace('n', ''))
      : BigInt(0);

  const exchangeRate = Number(formatUnits(tokenPaymentValue, selectedPaymentOption.decimals)) / Number(bidAmount);

  const paymentOptionBidAmount = useMemo(() => {
    if (selectedPaymentOption.currency === 'DEV') {
      return Number(debouncedBidAmount);
    }

    if (exchangeRate) {
      return ceilToPrecision(
        Number(debouncedBidAmount) * exchangeRate,
        selectedPaymentOption.currency === 'ETH' ? 6 : 4
      );
    }

    return null;
  }, [debouncedBidAmount, selectedPaymentOption, exchangeRate]);

  // Validate bid amount whenever it changes
  useEffect(() => {
    if (selectedTokenBalance === undefined) {
      setCustomError(null);
      return;
    }

    const numericBidAmount = Number(debouncedBidAmount);

    if (numericBidAmount < MIN_DEV_BID) {
      setCustomError(`Bid amount must be at least ${MIN_DEV_BID}`);
      return;
    }

    if (selectedPaymentOption.currency === 'DEV') {
      if (selectedTokenBalance < numericBidAmount) {
        setCustomError(`Insufficient balance in your wallet for this bid.`);
        return;
      }
    } else if (paymentOptionBidAmount && selectedTokenBalance < paymentOptionBidAmount) {
      setCustomError(`Insufficient balance of ${selectedPaymentOption.currency} in your wallet for this bid.`);
      return;
    }

    setCustomError(null);
  }, [debouncedBidAmount, selectedTokenBalance, selectedPaymentOption, paymentOptionBidAmount]);

  const selectedChainCurrency = selectedPaymentOption.address;

  const { allowance, refreshAllowance } = useGetERC20Allowance({
    chainId: selectedPaymentOption.chainId,
    erc20Address:
      selectedPaymentOption.currency === 'USDC' || selectedPaymentOption.currency === 'DEV'
        ? selectedChainCurrency
        : null,
    owner: address,
    spender: decentTransactionInfo && 'tx' in decentTransactionInfo ? decentTransactionInfo.tx.to : null
  });

  const amountToApprove =
    selectedPaymentOption.currency === 'DEV'
      ? BigInt(parseUnits(debouncedBidAmount, selectedPaymentOption.decimals))
      : paymentOptionBidAmount
        ? BigInt(parseUnits(paymentOptionBidAmount.toString(), selectedPaymentOption.decimals))
        : BigInt(0);

  const approvalRequired =
    selectedPaymentOption.currency !== 'ETH' &&
    typeof allowance === 'bigint' &&
    allowance < (typeof amountToApprove === 'bigint' ? amountToApprove : BigInt(0));

  const handleSubmit = async () => {
    setIsConfirmingBid(true);
    try {
      // Calculate bid amount in DEV tokens
      if (selectedPaymentOption.currency === 'DEV') {
        await sendDevTransaction({
          developerId,
          bidAmountInDev: parseUnits(bidAmount, 18),
          fromAddress: address
        });
      } else if (decentTransactionInfo && 'tx' in decentTransactionInfo) {
        await sendDraftTransaction({
          txData: {
            to: decentTransactionInfo.tx.to as Address,
            data: decentTransactionInfo.tx.data as any,
            value: BigInt((decentTransactionInfo.tx as EvmTransaction).value?.toString().replace('n', '') || '0')
          },
          txMetadata: {
            fromAddress: address,
            sourceChainId: selectedPaymentOption.chainId,
            developerId,
            bidAmount: parseUnits(bidAmount, 18)
          }
        });
      }

      onCancel();
    } catch (error) {
      log.error('Error submitting bid:', { error, address, developerId });
      if ((error as Error).message.includes('rejected')) {
        toast.error('Transaction rejected');
      } else {
        setCustomError('Failed to submit bid. Please try again.');
      }
    } finally {
      setIsConfirmingBid(false);
    }
  };

  // Switch chain automatically when payment option changes
  useEffect(() => {
    async function switchChain() {
      if (chainId !== selectedPaymentOption.chainId) {
        try {
          await switchChainAsync(
            { chainId: selectedPaymentOption.chainId },
            {
              onError() {
                setCustomError('Failed to switch chain');
              }
            }
          );
        } catch (error) {
          // some wallets dont support switching chain
          log.warn('Error switching chain for developer bid', {
            chainId,
            selectedChainId: selectedPaymentOption.chainId,
            error
          });
        }
      }
    }

    switchChain();
  }, [chainId, selectedPaymentOption.chainId, switchChainAsync]);

  const isLoading =
    isLoadingTokenBalances ||
    (selectedPaymentOption.currency !== 'DEV' && isLoadingDecentSdk) ||
    isSavingDraftTransaction ||
    isConfirmingBid;

  return (
    <Stack gap={1}>
      <PaymentTokenSelector
        selectedPaymentOption={selectedPaymentOption}
        onSelectPaymentOption={(option) => {
          setBidAmount(MIN_DEV_BID.toString());
          setSelectedPaymentOption(option);
        }}
        selectedTokenBalance={selectedTokenBalance}
        disabled={isLoading}
        tokensWithBalances={tokens}
      />
      <Stack gap={1}>
        <Typography color='text.secondary' fontWeight={500}>
          Your Bid
        </Typography>
        <Stack direction='row' alignItems='center' gap={0.5}>
          <Typography variant='body2'>Min Bid: {MIN_DEV_BID}</Typography>
          <Image src={TOKEN_LOGO_RECORD.DEV} alt='DEV' width={16} height={16} />
        </Stack>
        <TextField
          fullWidth
          value={bidAmount}
          type='number'
          disabled={isLoading}
          sx={{
            // Remove the up and down arrows from the number input
            '& input[type="number"]::-webkit-outer-spin-button, & input[type="number"]::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0
            }
          }}
          onChange={(e) => {
            if (e.target.value === '') {
              setBidAmount(MIN_DEV_BID.toString());
              return;
            }

            // Keep the raw string value to maintain decimal places
            const rawValue = e.target.value;
            const numericValue = Number(rawValue);

            if (Number.isNaN(numericValue) || numericValue < 0) {
              setBidAmount(MIN_DEV_BID.toString());
              return;
            }

            setBidAmount(rawValue);
          }}
          error={!!customError || !!draftError}
          helperText={customError || draftError}
          InputProps={{
            inputProps: {
              min: MIN_DEV_BID,
              step: 10
            },
            startAdornment: (
              <Image src={TOKEN_LOGO_RECORD.DEV} alt='DEV' width={20} style={{ marginRight: 4 }} height={20} />
            )
          }}
        />
      </Stack>
      {decentSdkError?.error && (
        <Typography variant='caption' color='error' align='center'>
          {decentSdkError.error.message?.includes('route')
            ? `Could not find a route between DEV and ${selectedPaymentOption.currency}. Please try a different payment option.`
            : 'There was an error communicating with Decent API'}
        </Typography>
      )}
      {addressError && (
        <Typography variant='caption' color='error' align='center' data-test='address-error'>
          {'message' in addressError
            ? addressError.message
            : `Address ${address} is already in use. Please connect a different wallet`}
        </Typography>
      )}
      {decentTransactionInfo && 'error' in decentTransactionInfo && bidAmount !== '0' && (
        <Typography variant='caption' color='error' align='center'>
          {decentTransactionInfo.error.message}
        </Typography>
      )}
      {selectedPaymentOption.currency !== 'DEV' && paymentOptionBidAmount ? (
        <Stack gap={0.5} alignItems='center' flexDirection='row'>
          <Typography variant='caption' align='center'>
            ≈ {paymentOptionBidAmount} {selectedPaymentOption.currency}
          </Typography>
          <Image
            src={TOKEN_LOGO_RECORD[selectedPaymentOption.currency]}
            alt={selectedPaymentOption.currency}
            width={14}
            height={14}
          />
        </Stack>
      ) : null}
      {!approvalRequired || isSavingDraftTransaction ? (
        <Stack direction='row' justifyContent='flex-end' alignItems='center' gap={1} mt={1}>
          <Button onClick={onCancel} variant='outlined' color='secondary' size='large' disabled={isLoading}>
            Cancel
          </Button>
          <Button
            loading={isLoading}
            onClick={handleSubmit}
            variant='contained'
            color='secondary'
            size='large'
            disabled={
              !!customError ||
              (selectedPaymentOption.currency !== 'DEV' &&
                (!decentTransactionInfo || !('tx' in decentTransactionInfo) || 'error' in decentTransactionInfo)) ||
              !!draftError ||
              !!addressError
            }
          >
            Confirm
          </Button>
        </Stack>
      ) : decentTransactionInfo && 'tx' in decentTransactionInfo ? (
        <ERC20ApproveButton
          spender={decentTransactionInfo?.tx.to as Address}
          chainId={selectedPaymentOption.chainId}
          erc20Address={selectedPaymentOption.address}
          amount={amountToApprove}
          onSuccess={refreshAllowance}
          decimals={selectedPaymentOption.decimals}
          currency={selectedPaymentOption.currency}
          actionType='bid'
          color='secondary'
        />
      ) : null}
    </Stack>
  );
}
