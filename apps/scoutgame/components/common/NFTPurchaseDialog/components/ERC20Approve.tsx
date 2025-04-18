import { LoadingButton } from '@mui/lab';
import type { ButtonProps } from '@mui/material';
import { Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import type { Address } from 'viem';
import { useSwitchChain, useWalletClient } from 'wagmi';

import { useUpdateERC20Allowance } from '../hooks/useUpdateERC20Allowance';

import type { AvailableCurrency } from './ChainSelector/chains';

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
  color = 'primary'
}: ERC20ApproveButtonProps) {
  const amountToApprove = amount ? amount + amount / BigInt(50) : undefined;

  const { data: walletClient } = useWalletClient();

  const { switchChainAsync } = useSwitchChain();

  const { triggerApproveSpender, isApprovingSpender } = useUpdateERC20Allowance({ chainId, erc20Address, spender });

  async function approveSpender() {
    if (walletClient?.chain.id !== chainId) {
      return switchChainAsync({ chainId });
    }
    if (!amountToApprove) {
      throw new Error('Amount to approve is required');
    }
    await triggerApproveSpender({ amount: amountToApprove });
    onSuccess();
  }

  const displayAmount = (Number(amountToApprove || 0) / 10 ** decimals).toFixed(2);

  return (
    <div>
      <Stack>
        <LoadingButton
          loading={isApprovingSpender}
          variant='contained'
          color={color}
          onClick={approveSpender}
          disabled={isApprovingSpender}
          data-test='approve-spending-nft-purchase-button'
        >
          {isApprovingSpender ? 'Approving...' : `Approve ${displayAmount} ${currency}`}
        </LoadingButton>
        <Typography sx={{ mb: 1 }} variant='caption'>
          You must approve the {currency} spend before you can {actionType} an NFT
        </Typography>
      </Stack>
    </div>
  );
}
