import { log } from '@charmverse/core/log';
import type { Application } from '@charmverse/core/prisma';
import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import type { AlertColor, ButtonProps } from '@mui/material';
import { Divider, Menu, MenuItem, Tooltip } from '@mui/material';
import ERC20ABI from 'abis/ERC20.json';
import { getChainById } from 'connectors/chains';
import { ethers } from 'ethers';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import { parseEther, parseUnits } from 'viem';

import charmClient from 'charmClient';
import { OpenWalletSelectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/OpenWalletSelectorButton';
import { Button } from 'components/common/Button';
import TokenLogo from 'components/common/TokenLogo';
import { useGnosisSafes } from 'hooks/useGnosisSafes';
import { getPaymentErrorMessage } from 'hooks/useMultiGnosisPayment';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { SupportedChainId } from 'lib/blockchain/provider/alchemy/config';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { isValidChainAddress } from 'lib/tokens/validation';
import { shortenHex } from 'lib/utilities/blockchain';

import { GnosisSafesList } from './GnosisSafesList';

interface Props {
  buttonVariant?: ButtonProps['variant'];
  receiver: string;
  amount: string;
  tokenSymbolOrAddress: string;
  chainIdToUse: number;
  submission: Application;
  onSuccess?: (txId: string, chainId: number) => void;
  onError?: (err: string, severity?: AlertColor) => void;
  reward: RewardWithUsers;
  refreshSubmission: () => void;
}

export function RewardPaymentButton({
  amount,
  receiver,
  refreshSubmission,
  reward,
  submission,
  onError = () => {},
  onSuccess = () => {},
  chainIdToUse,
  tokenSymbolOrAddress,
  buttonVariant
}: Props) {
  const { account, chainId, signer } = useWeb3Account();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [sendingTx, setSendingTx] = useState(false);

  const safeDataRecord = useGnosisSafes(chainIdToUse);

  const [paymentMethods] = usePaymentMethods();

  const makePayment = async () => {
    if (!chainIdToUse) {
      onError('Please set up a chain for this payment.');
      return;
    }

    const chainToUse = getChainById(chainIdToUse);

    if (!signer) {
      onError('Please make sure you are connected to a supported network and your wallet is unlocked.');
      return;
    }

    try {
      setSendingTx(true);

      if (chainIdToUse !== chainId) {
        await switchActiveNetwork(chainIdToUse);
      }

      let receiverAddress = receiver;

      if (receiver.endsWith('.eth') && ethers.utils.isValidName(receiver)) {
        const resolvedWalletAddress = await charmClient.resolveEnsName(receiver);
        if (resolvedWalletAddress === null) {
          onError(`Could not resolve ENS name ${receiver}`);
          return;
        }

        receiverAddress = resolvedWalletAddress;
      }

      if (isValidChainAddress(tokenSymbolOrAddress)) {
        const tokenContract = new Contract(tokenSymbolOrAddress, ERC20ABI, signer);

        const paymentMethod = paymentMethods.find(
          (method) => method.contractAddress === tokenSymbolOrAddress || method.id === tokenSymbolOrAddress
        );
        let tokenDecimals = paymentMethod?.tokenDecimals;

        if (typeof tokenDecimals !== 'number') {
          try {
            const tokenInfo = await charmClient.getTokenMetaData({
              chainId: chainIdToUse as SupportedChainId,
              contractAddress: tokenSymbolOrAddress
            });
            tokenDecimals = tokenInfo.decimals;
          } catch (error) {
            onError(
              `Token information is missing. Please go to payment methods to configure this payment method using contract address ${tokenSymbolOrAddress} on chain: ${chainIdToUse}`
            );
            return;
          }
        }

        const parsedTokenAmount = parseUnits(amount, tokenDecimals);

        // get allowance
        const allowance = await tokenContract.allowance(account, receiverAddress);

        if (BigNumber.from(allowance).lt(parsedTokenAmount)) {
          // approve if the allowance is small
          await tokenContract.approve(receiverAddress, parsedTokenAmount);
        }

        // transfer token
        const tx = await tokenContract.transfer(receiverAddress, parsedTokenAmount);
        onSuccess(tx.hash, chainToUse!.chainId);
      } else {
        const tx = await signer.sendTransaction({
          to: receiverAddress,
          value: parseEther(amount)
        });

        onSuccess(tx.hash, chainIdToUse);
      }
    } catch (error: any) {
      const { message, level } = getPaymentErrorMessage(error);
      log.warn(`Error sending payment on blockchain: ${message}`, { amount, chainId, error });
      onError(message, level);
    } finally {
      setSendingTx(false);
    }
  };

  const hasSafes = Object.keys(safeDataRecord).length > 0;

  if (!account || !chainId || !signer) {
    return (
      <div>
        <Tooltip title='Your wallet must be unlocked to pay for this reward'>
          <OpenWalletSelectorButton size='small' label='Unlock Wallet' />
        </Tooltip>
      </div>
    );
  }

  const chainInfo = getChainById(chainIdToUse as number);

  return (
    <>
      <Button
        loading={sendingTx}
        color='primary'
        variant={buttonVariant}
        endIcon={hasSafes && !sendingTx ? <KeyboardArrowDownIcon /> : null}
        size='small'
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          if (!hasSafes) {
            makePayment();
          } else {
            handleClick(e);
          }
        }}
      >
        Send Payment
      </Button>
      {hasSafes && (
        <Menu id='bounty-payment' anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem dense sx={{ pointerEvents: 'none', color: 'secondary.main' }}>
            Connected wallet
          </MenuItem>
          <MenuItem
            dense
            onClick={async () => {
              await makePayment();
              handleClose();
            }}
          >
            {shortenHex(account ?? '')}
          </MenuItem>
          <Divider />
          <GnosisSafesList
            onClick={handleClose}
            refreshSubmissions={refreshSubmission}
            chainIdToUse={chainIdToUse}
            rewards={[
              {
                ...reward,
                submissions: [submission]
              }
            ]}
          />
        </Menu>
      )}
    </>
  );
}
