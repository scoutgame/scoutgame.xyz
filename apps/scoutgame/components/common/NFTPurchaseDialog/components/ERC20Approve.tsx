import { log } from '@charmverse/core/log';
import type { ButtonProps } from '@mui/material';
import { Button, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import type { Address } from 'viem';
import { useSwitchChain, useWalletClient } from 'wagmi';

import { useUpdateERC20Allowance } from '../hooks/useUpdateERC20Allowance';

import type { AvailableCurrency } from './ChainSelector/chains';

const MAX_UINT256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

// Component for approving ERC20 tokens
type ERC20ApproveButtonProps = {
  onSuccess: () => void;
  amount?: bigint; // Optional amount input
  spender: Address;
  chainId: number;
  erc20Address: Address;
  decimals?: number;
  currency?: AvailableCurrency;
  actionType: 'mint' | 'purchase' | 'bid';
  color?: ButtonProps['color'];
  hideWarning?: boolean;
};

export function ERC20ApproveButton({
  onSuccess,
  amount,
  chainId,
  erc20Address,
  spender,
  // Default to decimals for USDC
  decimals = 6,
  currency = 'USDC',
  actionType,
  color = 'primary',
  hideWarning = false
}: ERC20ApproveButtonProps) {
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  // Calculate approval amount once, at the top
  const isUnlimitedApproval = amount === MAX_UINT256;
  const amountToApprove = isUnlimitedApproval ? amount : amount ? amount + amount / BigInt(50) : undefined;

  const { triggerApproveSpender, isApprovingSpender } = useUpdateERC20Allowance({ chainId, erc20Address, spender });

  async function approveSpender() {
    if (walletClient?.chain.id !== chainId) {
      try {
        await switchChainAsync({ chainId });
      } catch (error) {
        // some wallets dont support switching chain
        log.warn('Error switching chain for approve spend', { chainId, error });
      }
    }
    if (!amountToApprove || !amount) {
      throw new Error('Amount to approve is required');
    }
    try {
      await triggerApproveSpender({ amount: amountToApprove });
      onSuccess();
    } catch (error) {
      log.error('Error approving spend', { error });
    }
  }

  const displayAmount = isUnlimitedApproval ? 'Unlimited' : (Number(amountToApprove || 0) / 10 ** decimals).toFixed(2);

  return (
    <Stack>
      <Button
        loading={isApprovingSpender}
        variant='contained'
        color={color}
        onClick={approveSpender}
        disabled={isApprovingSpender}
        data-test='approve-spending-nft-purchase-button'
      >
        {isApprovingSpender ? 'Approving...' : `Approve ${displayAmount} ${currency}`}
      </Button>
      {!hideWarning && (
        <Typography sx={{ mb: 1 }} variant='caption'>
          You must approve the {currency} spend before you can {actionType} an NFT
        </Typography>
      )}
    </Stack>
  );
}
