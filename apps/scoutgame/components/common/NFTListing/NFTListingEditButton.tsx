import { log } from '@charmverse/core/log';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { LoadingButton } from '@mui/lab';
import { Alert, Button, Stack, Tooltip, Typography } from '@mui/material';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { cancelNftListingAction } from '@packages/scoutgame/nftListing/cancelNftListingAction';
import { devTokenDecimals, scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
import { cancelSeaportListing } from '@packages/scoutgame/seaport/cancelSeaportListing';
import { isOnchainPlatform } from '@packages/utils/platform';
import { fancyTrim } from '@packages/utils/strings';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';

import { Dialog } from '../Dialog';

export function NFTListingEditButton({ listing }: { listing: NonNullable<BuilderInfo['listings']>[number] }) {
  const isOnchain = isOnchainPlatform();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [isCancelling, setIsCancelling] = useState(false);
  const { data: walletClient } = useWalletClient();

  const { executeAsync: cancelNftListing } = useAction(cancelNftListingAction, {
    onSuccess: () => {
      toast.success('Nft delisted successfully');
      setIsConfirmModalOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to delist nft listing');
      log.error('Failed to delist nft listing', { error, listingId: listing.id });
    }
  });

  const listingPrice = isOnchain
    ? Number(BigInt(listing.price) / BigInt(10 ** devTokenDecimals))
    : Number(listing.price) / 10 ** builderTokenDecimals;

  const ownerAddress = listing.order.parameters.consideration[0].recipient;

  const isOwner = ownerAddress.toLowerCase() === address?.toLowerCase();

  const onDeleteListing = async () => {
    setIsCancelling(true);

    try {
      if (!address || !walletClient) {
        return;
      }

      if (chainId !== scoutProtocolChainId) {
        await switchChainAsync({
          chainId: scoutProtocolChainId
        });
      }

      const preparedTx = await cancelSeaportListing({
        order: listing.order.parameters,
        sellerWallet: address
      });

      const hash = await walletClient.sendTransaction({
        to: preparedTx.to as `0x${string}`,
        data: preparedTx.data as `0x${string}`
      });

      const publicClient = getPublicClient(scoutProtocolChainId);

      await publicClient.waitForTransactionReceipt({
        hash
      });

      await cancelNftListing({ listingId: listing.id });
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Failed to delist nft listing';
      if (message.includes('denied')) {
        message = 'User rejected the transaction';
      }
      toast.error(message);
      log.error('Failed to delist nft listing', { error, listingId: listing.id });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Stack
        direction='row'
        pt={1}
        pb={{ xs: 1, md: 0 }}
        px={1}
        gap={1}
        alignItems='center'
        justifyContent='space-between'
      >
        <Button variant='text' fullWidth>
          <Typography color='secondary'>{listingPrice} &nbsp;</Typography>
          {isOnchain ? 'DEV' : <Image src='/images/crypto/usdc.png' alt='usdc' width={18} height={18} />}
        </Button>
        <Tooltip title='Delist your nft listing'>
          <div>
            <Button
              variant='outlined'
              color='error'
              sx={{
                width: 'fit-content',
                minWidth: 16,
                px: 0.75
              }}
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={isCancelling || !address || !walletClient}
            >
              <SettingsBackupRestoreIcon color='error' sx={{ mr: 0.5, fontSize: '16px' }} />
            </Button>
          </div>
        </Tooltip>
      </Stack>
      <Dialog title='Delist your nft listing' open={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <Typography>Are you sure you want to delist this listing? This action cannot be undone.</Typography>
        {!isOwner && (
          <Alert sx={{ mt: 1 }} severity='warning'>
            You are not the owner of this nft listing. Only the owner can delist the listing. Please switch to the
            owner's wallet to delist it. <br />
            Owner address: {fancyTrim(ownerAddress, 10)}
          </Alert>
        )}
        <Stack flexDirection='row' alignItems='center' gap={1} mt={2}>
          <Button
            color='primary'
            variant='outlined'
            onClick={() => setIsConfirmModalOpen(false)}
            disabled={isCancelling}
          >
            Cancel
          </Button>
          <LoadingButton
            variant='contained'
            loading={isCancelling}
            disabled={!isOwner}
            color='error'
            onClick={onDeleteListing}
          >
            Delist
          </LoadingButton>
        </Stack>
      </Dialog>
    </>
  );
}
