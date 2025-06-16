import { log } from '@charmverse/core/log';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { ceilToPrecision } from '@packages/utils/numbers';
import { useEffect } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';

import { useDecentV4Transaction } from 'components/common/DraftDeveloperInfoModal/hooks/useDecentV4Transaction';
import { useGetERC20Allowance } from 'components/common/NFTPurchaseDialog/hooks/useGetERC20Allowance';
import type { PaymentOption } from 'components/common/PaymentTokenSelector';

export function useTokenPayment({
  paymentOption,
  devTokenAmount,
  hasTokenBalance,
  toAddress
}: {
  paymentOption: PaymentOption;
  devTokenAmount: number; // formatted value
  hasTokenBalance: boolean;
  toAddress: string;
}) {
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const {
    decentSdkError: decentError,
    isLoadingDecentSdk,
    decentTransactionInfo
  } = useDecentV4Transaction({
    address: address!,
    sourceChainId: paymentOption.chainId,
    receiverAddress: toAddress,
    sourceToken: paymentOption.address,
    enabled: !!(paymentOption.currency !== 'DEV' && hasTokenBalance),
    amount: parseUnits(devTokenAmount.toString(), devTokenDecimals)
  });

  const exchangeRate =
    decentTransactionInfo && 'tokenPayment' in decentTransactionInfo ? decentTransactionInfo.exchangeRate : null;

  const sourceTokenAmount =
    paymentOption.currency === 'DEV'
      ? devTokenAmount
      : exchangeRate
        ? ceilToPrecision(devTokenAmount * exchangeRate, paymentOption.currency === 'ETH' ? 6 : 4)
        : null;

  const selectedChainCurrency = paymentOption.address;

  const { allowance, refreshAllowance } = useGetERC20Allowance({
    chainId: paymentOption.chainId,
    erc20Address:
      paymentOption.currency === 'USDC' || paymentOption.currency === 'DEV' || paymentOption.currency === 'CELO'
        ? selectedChainCurrency
        : null,
    owner: address,
    spender: decentTransactionInfo && 'tx' in decentTransactionInfo ? decentTransactionInfo.tx.to : null
  });

  const amountToApprove =
    paymentOption.currency === 'DEV'
      ? BigInt(parseUnits(devTokenAmount.toString(), paymentOption.decimals))
      : sourceTokenAmount
        ? BigInt(parseUnits(sourceTokenAmount.toString(), paymentOption.decimals))
        : BigInt(0);

  const approvalRequired =
    paymentOption.currency !== 'ETH' &&
    typeof allowance === 'bigint' &&
    allowance < (typeof amountToApprove === 'bigint' ? amountToApprove : BigInt(0));

  // Switch chain automatically when payment option changes
  useEffect(() => {
    async function switchChain() {
      if (chainId !== paymentOption.chainId) {
        try {
          await switchChainAsync({ chainId: paymentOption.chainId });
        } catch (error) {
          // some wallets dont support switching chain
          log.warn('Error switching chain for token payment', {
            chainId,
            selectedChainId: paymentOption.chainId,
            error
          });
        }
      }
    }

    switchChain();
  }, [chainId, paymentOption.chainId, switchChainAsync]);

  const isLoading = paymentOption.currency !== 'DEV' && isLoadingDecentSdk;

  return {
    isLoading,
    exchangeRate,
    sourceTokenAmount,
    approvalRequired,
    decentError,
    decentTransactionInfo,
    refreshAllowance
  };
}
