import { Button } from '@mui/material';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { isOnchainPlatform } from '@packages/utils/platform';
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { useAccount } from 'wagmi';

function PurchaseListedCardButtonComponent({
  listing
}: {
  listing: {
    id: string;
    price: string;
  };
}) {
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { address } = useAccount();
  const isOnchain = isOnchainPlatform();
  const listingPrice = isOnchain
    ? Number(BigInt(listing.price) / BigInt(10 ** devTokenDecimals))
    : Number(listing.price) / 10 ** builderTokenDecimals;

  return (
    <Button
      variant='buy'
      color='secondary'
      fullWidth
      onClick={() => {
        if (!address && !connectModalOpen) {
          openConnectModal?.();
        }
      }}
    >
      {listingPrice} &nbsp;{' '}
      {isOnchain ? 'DEV' : <Image src='/images/crypto/usdc.png' alt='usdc' width={18} height={18} />}
    </Button>
  );
}

export function PurchaseListedCardButton({
  listing
}: {
  listing: {
    id: string;
    price: string;
  };
}) {
  return (
    <RainbowKitProvider>
      <PurchaseListedCardButtonComponent listing={listing} />
    </RainbowKitProvider>
  );
}
