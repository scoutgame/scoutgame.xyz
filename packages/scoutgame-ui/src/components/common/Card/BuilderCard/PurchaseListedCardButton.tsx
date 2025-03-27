import { Button } from '@mui/material';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { isOnchainPlatform } from '@packages/utils/platform';
import Image from 'next/image';

import { scoutProtocolChain } from '../../../../../../scoutgame/src/protocol/constants';

export function PurchaseListedCardButton({
  listing
}: {
  listing: {
    id: string;
    price: string;
  };
}) {
  const isOnchain = isOnchainPlatform();
  const listingPrice = isOnchain
    ? Number(BigInt(listing.price) / BigInt(10 ** devTokenDecimals))
    : Number(listing.price) / 10 ** builderTokenDecimals;

  return (
    <Button variant='buy' color='secondary' fullWidth>
      {listingPrice} &nbsp;{' '}
      {isOnchain ? 'DEV' : <Image src='/images/crypto/usdc.png' alt='usdc' width={18} height={18} />}
    </Button>
  );
}
