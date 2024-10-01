'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { ActionType, ChainId, SwapDirection } from '@decent.xyz/box-common';
import { BoxHooksContextProvider, useBoxAction } from '@decent.xyz/box-hooks';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControlLabel,
  RadioGroup,
  Radio,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { BuilderNFTSeasonOneImplementation01Client } from '@packages/scoutgame/builderNfts/clients/builderNFTSeasonOneClient';
import {
  builderNftChain,
  builderTokenDecimals,
  getBuilderContractAddress,
  treasuryAddress,
  usdcContractAddress,
  useTestnets
} from '@packages/scoutgame/builderNfts/constants';
import { USDcAbiClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import { getPublicClient } from '@root/lib/blockchain/publicClient';
import { switchChain } from '@wagmi/core';
import Image from 'next/image';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import { formatUnits } from 'viem';
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi';

import { PointsIcon } from 'components/common/Icons';
import { handleMintNftAction } from 'lib/builderNFTs/handleMintNftAction';
import { mintNftAction } from 'lib/builderNFTs/mintNftAction';
import type { MinimalUserInfo } from 'lib/users/interfaces';

import { IconButton } from '../Button/IconButton';
import { NumberInputField } from '../Fields/NumberField';

import type { ChainOption } from './ChainSelector';
import { BlockchainSelect, getChainOptions } from './ChainSelector';

export type NFTPurchaseProps = {
  builder: MinimalUserInfo & { price?: bigint; nftImageUrl?: string | null };
};

function NFTPurchaseButton({ builder }: NFTPurchaseProps) {
  const builderId = builder.id;
  const initialQuantities = [1, 11, 111, 1111];
  const pricePerNft = (Number(builder.price) / 10 ** builderTokenDecimals).toFixed(2);
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const builderContractReadonlyApiClient = new BuilderNFTSeasonOneImplementation01Client({
    chain: builderNftChain,
    contractAddress: getBuilderContractAddress(),
    publicClient: getPublicClient(builderNftChain.id)
  });

  const [sourceFundsChain, setSourceFundsChain] = useState(useTestnets ? ChainId.OPTIMISM_SEPOLIA : ChainId.OPTIMISM);

  // const [nftApiClient, setNftApiClient] = useState<BuilderNFTSeasonOneClient>(null);

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [fetchError, setFetchError] = useState<any>(null);

  const [tokensToBuy, setTokensToBuy] = useState(1);

  const [paymentMethod, setPaymentMethod] = useState<'points' | 'wallet'>('points');

  const [balances, setBalances] = useState<{ usdc: bigint; eth: bigint; chainId: number } | null>(null);

  // Data from onchain
  const [purchaseCost, setPurchaseCost] = useState(BigInt(0));
  const [builderTokenId, setBuilderTokenId] = useState<bigint>(BigInt(0));

  const {
    isExecuting: isHandleMintNftExecuting,
    hasSucceeded: hasHandleMintNftSucceeded,
    executeAsync: executeHandleMintNft
  } = useAction(handleMintNftAction, {});

  const {
    isExecuting: isExecutingMintNftAction,
    hasSucceeded: hasSucceededMintNftAction,
    executeAsync
  } = useAction(mintNftAction, {
    async onSuccess(res) {
      if (res.data?.id) {
        // await executeHandleMintNft({ pendingTransactionId: res.data.id });
      }
      log.info('NFT minted', { chainId, builderTokenId, purchaseCost });
    },
    onError(err) {
      log.error('Error minting NFT', { chainId, builderTokenId, purchaseCost, error: err });
    }
  });

  const refreshBalance = useCallback(async () => {
    const chainOption = getChainOptions({ useTestnets }).find((opt) => opt.id === sourceFundsChain) as ChainOption;

    const chain = chainOption?.chain;

    const _chainId = chain?.id;

    if (!_chainId) {
      return;
    }

    const client = new USDcAbiClient({
      chain,
      contractAddress: chainOption.usdcAddress as `0x${string}`,
      publicClient: getPublicClient(_chainId)
    });

    const usdcBalance = await client.balanceOf({ args: { account: address as `0x${string}` } });

    const ethBalance = await getPublicClient(_chainId).getBalance({
      address: address as `0x${string}`
    });

    const newBalances = {
      usdc: usdcBalance,
      eth: ethBalance,
      chainId: _chainId
    };

    setBalances(newBalances);

    return newBalances;
  }, [address, sourceFundsChain]);

  useEffect(() => {
    if (sourceFundsChain) {
      refreshBalance().catch((err) => {
        log.error('Error refreshing balance', { error: err });
      });
    }
  }, [sourceFundsChain]);

  const { sendTransaction } = useSendTransaction();

  const refreshAsk = useCallback(
    async ({ _builderTokenId, amount }: { _builderTokenId: bigint | number; amount: bigint | number }) => {
      const _price = await builderContractReadonlyApiClient.getTokenPurchasePrice({
        args: { amount: BigInt(amount), tokenId: BigInt(_builderTokenId) }
      });
      setPurchaseCost(_price);
    },
    [setPurchaseCost]
  );

  async function refreshTokenData() {
    setFetchError(null);
    try {
      setIsFetchingPrice(true);
      const _builderTokenId = await builderContractReadonlyApiClient.getTokenIdForBuilder({ args: { builderId } });

      setBuilderTokenId(_builderTokenId);

      await refreshAsk({ _builderTokenId, amount: tokensToBuy });

      setIsFetchingPrice(false);
    } catch (error) {
      setIsFetchingPrice(false);
      setFetchError(error);
    }
  }

  useEffect(() => {
    if (builderId) {
      refreshTokenData();
    }
  }, [builderId]);

  useEffect(() => {
    if (tokensToBuy && builderTokenId) {
      refreshAsk({ _builderTokenId: builderTokenId, amount: tokensToBuy });
    }
  }, [tokensToBuy, builderTokenId, refreshAsk]);

  /** TODO - Use this payload when we resume calling the contract directly
   {
    enable: !!address && !!purchaseCost,
    actionType: ActionType.EvmFunction,
    sender: address as string,
    srcToken: '0x0000000000000000000000000000000000000000',
    dstToken: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    slippage: 1,

    srcChainId: ChainId.BASE,
    dstChainId: ChainId.OPTIMISM,
    actionConfig: {
      chainId: ChainId.OPTIMISM,
      contractAddress: '0x7df4d9f54a5cddfef50a032451f694d6345c60af',
      cost: {
        amount: purchaseCost,
        isNative: false,
        tokenAddress: '0x0b2c639c533813f4aa9d7837caf62653d097ff85'
      },
      signature: 'function mintBuilderNft(uint256 tokenId, uint256 amount, string calldata scout) external',
      args: [BigInt(1), BigInt(1), 'c42efe4a-b385-488e-a5ca-135ecec0f810']
    }
  }
   */

  const {
    error: decentSdkError,
    isLoading,
    actionResponse
  } = useBoxAction({
    enable: !!address && !!sourceFundsChain,
    sender: address as `0x${string}`,
    srcToken: '0x0000000000000000000000000000000000000000',
    dstToken: usdcContractAddress,
    srcChainId: 8453,
    dstChainId: ChainId.OPTIMISM,
    slippage: 1,
    actionType: ActionType.SwapAction,
    // @ts-ignore
    actionConfig: {
      amount: purchaseCost,
      swapDirection: SwapDirection.EXACT_AMOUNT_OUT,
      receiverAddress: treasuryAddress as string
    }
  });

  const handlePurchase = async () => {
    if (!actionResponse?.tx) {
      return;
    }

    if (chainId !== sourceFundsChain) {
      await switchChainAsync({ chainId: sourceFundsChain });
    }

    sendTransaction(
      {
        to: actionResponse.tx.to as Address,
        data: actionResponse.tx.data as any,
        value: (actionResponse.tx as any).value
      },
      {
        onSuccess: async (data) => {
          await executeAsync({
            user: {
              walletAddress: address as `0x${string}`
            },
            transactionInfo: {
              destinationChainId: builderNftChain.id,
              sourceChainId: sourceFundsChain,
              sourceChainTxHash: data
            },
            purchaseInfo: {
              quotedPrice: Number(purchaseCost),
              tokenAmount: tokensToBuy,
              builderContractAddress: getBuilderContractAddress(),
              tokenId: Number(builderTokenId),
              quotedPriceCurrency: usdcContractAddress
            }
          });
        },
        onError: (err: any) => {
          log.error('Mint failed', { error: err });
        }
      }
    );
  };

  // Add hasHandleMintNftSucceeded after fixing handleMintNftAction
  if (hasSucceededMintNftAction) {
    return (
      <Stack gap={2} textAlign='center'>
        <Typography color='secondary' variant='h5' fontWeight={600}>
          Congratulations!
        </Typography>
        <Typography>You scouted @{builder.username}</Typography>
        <Box
          bgcolor='black.dark'
          width='100%'
          p={2}
          display='flex'
          alignItems='center'
          flexDirection='column'
          gap={1}
          py={12}
          sx={{
            background: 'url(/images/nft-mint-bg.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          {builder.nftImageUrl ? (
            <Image
              src={builder.nftImageUrl}
              alt={builder.username}
              width={200}
              height={300}
              style={{ aspectRatio: '1/1.4', width: '50%', height: '50%' }}
            />
          ) : (
            <Image src='/images/no_nft_person.png' alt='no nft image available' width={200} height={200} />
          )}
        </Box>
        <Button
          LinkComponent={Link}
          fullWidth
          href={`https://warpcast.com/~/compose?text=${encodeURI(
            `I scouted ${builder.username} on Scout Game!`
          )}&embeds[]=${window.location.origin}/u/${builder.username}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          Share now
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap={3}>
      <Box bgcolor='black.dark' width='100%' p={2} display='flex' alignItems='center' flexDirection='column' gap={1}>
        {builder.nftImageUrl ? (
          <Image
            src={builder.nftImageUrl}
            alt={builder.username}
            width={200}
            height={300}
            style={{ aspectRatio: '1/1.4', width: '50%', height: '50%' }}
          />
        ) : (
          <Image src='/images/no_nft_person.png' alt='no nft image available' width={200} height={200} />
        )}
        <Typography textAlign='center' fontWeight={600} color='secondary'>
          ${pricePerNft}
        </Typography>
      </Box>
      <Stack gap={1}>
        <Typography color='secondary'>Select quantity</Typography>
        <ToggleButtonGroup
          value={tokensToBuy}
          onChange={(_: React.MouseEvent<HTMLElement>, n: number) => setTokensToBuy((prevN) => n || prevN)}
          exclusive
          fullWidth
          aria-label='quantity selection'
        >
          {initialQuantities.map((q) => (
            <ToggleButton sx={{ minWidth: 60, minHeight: 40 }} key={q} value={q} aria-label={q.toString()}>
              {q}
            </ToggleButton>
          ))}
          <ToggleButton value={2} aria-label='custom' onClick={() => setTokensToBuy(2)}>
            Custom
          </ToggleButton>
        </ToggleButtonGroup>
        {!initialQuantities.includes(tokensToBuy) && (
          <Stack flexDirection='row' gap={2}>
            <IconButton color='secondary' onClick={() => setTokensToBuy((prevN) => prevN - 1)}>
              -
            </IconButton>
            <NumberInputField
              fullWidth
              color='secondary'
              id='builderId'
              type='number'
              placeholder='Quantity'
              value={tokensToBuy}
              onChange={(e) => setTokensToBuy(parseInt(e.target.value))}
              disableArrows
              sx={{ '& input': { textAlign: 'center' } }}
            />
            <IconButton color='secondary' onClick={() => setTokensToBuy((prevN) => prevN + 1)}>
              +
            </IconButton>
          </Stack>
        )}
      </Stack>
      <Stack>
        <Stack flexDirection='row' alignItems='center' gap={1} mb={1}>
          <Typography color='secondary'>Total cost</Typography>
          <Link href='/info#builder-nfts' target='_blank' title='Read how Builder NFTs are priced'>
            <InfoIcon sx={{ fontSize: 16, opacity: 0.5 }} />
          </Link>
        </Stack>
        <Stack flexDirection='row' justifyContent='space-between'>
          <Typography variant='caption' color='secondary' sx={{ width: '33%' }}>
            Qty
          </Typography>
          <Typography
            variant='caption'
            color='secondary'
            align='center'
            sx={{ position: 'relative', top: -4, width: '33%' }}
          >
            Points{' '}
            <Box display='inline' position='relative' top={4}>
              <PointsIcon size={18} color='blue' />
            </Box>{' '}
            (50% off)
          </Typography>
          <Typography variant='caption' color='secondary' align='right' sx={{ width: '33%' }}>
            USDC $
          </Typography>
        </Stack>
        <Stack flexDirection='row' justifyContent='space-between'>
          <Typography sx={{ width: '33%' }}>{tokensToBuy} NFT</Typography>
          <Typography align='center' sx={{ width: '33%', position: 'relative', top: -4 }}>
            {purchaseCost && (
              <>
                {convertCostToPointsWithDiscount(purchaseCost)}{' '}
                <Box display='inline' position='relative' top={4}>
                  <PointsIcon size={18} />
                </Box>
              </>
            )}
          </Typography>
          <Typography align='right' sx={{ width: '33%' }}>
            {purchaseCost && convertCostToUsd(purchaseCost)}
            {isFetchingPrice && `Fetching...`}
          </Typography>
        </Stack>
      </Stack>
      <Stack>
        <Typography color='secondary' mb={1}>
          Select payment
        </Typography>
        <RadioGroup
          row
          aria-label='payment method'
          name='payment-method'
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as 'points' | 'wallet')}
          sx={{ mb: 2, display: 'flex', gap: 2, width: '100%' }}
        >
          <FormControlLabel
            value='points'
            control={<Radio />}
            sx={{ width: '50%' }}
            label={
              <Stack direction='row' alignItems='center' spacing={0.5}>
                <Typography>Scout Points</Typography>
              </Stack>
            }
          />
          <FormControlLabel value='wallet' control={<Radio />} label='Wallet' />
        </RadioGroup>
        <BlockchainSelect
          value={sourceFundsChain}
          balance={(Number(balances?.eth || 0) / 1e18).toFixed(4)}
          useTestnets={useTestnets}
          onSelectChain={(_chainId) => {
            setSourceFundsChain(_chainId);
          }}
        />
      </Stack>
      {fetchError && <Typography color='red'>{fetchError.shortMessage || 'Something went wrong'}</Typography>}
      <Button
        onClick={handlePurchase}
        disabled={
          !purchaseCost ||
          isLoading ||
          isFetchingPrice ||
          !treasuryAddress ||
          isExecutingMintNftAction ||
          isHandleMintNftExecuting
        }
      >
        {isFetchingPrice ? 'Fetching price' : isLoading ? 'Loading...' : 'Buy'}
      </Button>
      {decentSdkError instanceof Error ? (
        <Typography color='error'>Error: {(decentSdkError as Error).message}</Typography>
      ) : null}
    </Stack>
  );
}

export function NFTPurchaseForm(props: NFTPurchaseProps) {
  // Waiting for component to render before fetching the API key
  const apiKey = env('DECENT_API_KEY');

  if (!apiKey) {
    return <Typography color='error'>Decent API key not found</Typography>;
  }

  return (
    <BoxHooksContextProvider apiKey={apiKey}>
      <NFTPurchaseButton {...props} />
    </BoxHooksContextProvider>
  );
}

function convertCostToUsd(cost: bigint) {
  return `$${parseFloat(formatUnits(cost, 6)).toLocaleString()}`;
}

// 1 Point is $.10. So $1 is 10 points
function convertCostToPoints(costWei: bigint) {
  const costInUsd = Number(formatUnits(costWei, 6));
  return costInUsd * 10;
}

function convertCostToPointsWithDiscount(costWei: bigint) {
  const points = convertCostToPoints(costWei);
  // 50% discount
  return Math.round(points * 0.5);
}
