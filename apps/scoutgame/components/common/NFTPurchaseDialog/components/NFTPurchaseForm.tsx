'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import type { BuilderNftType } from '@charmverse/core/prisma';
import { BoxHooksContextProvider } from '@decent.xyz/box-hooks';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import {
  getNFTContractAddressForNftType,
  maxTokenSupply,
  scoutgameEthAddress
} from '@packages/scoutgame/builderNfts/constants';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { getNFTReadonlyClient } from '@packages/scoutgame/protocol/clients/getNFTClient';
import { getStarterNFTReadonlyClient } from '@packages/scoutgame/protocol/clients/getStarterNFTClient';
import {
  devTokenContractAddress,
  devTokenDecimals,
  scoutProtocolChainId
} from '@packages/scoutgame/protocol/constants';
import { calculateRewardForScout } from '@packages/scoutgame/tokens/divideTokensBetweenDeveloperAndHolders';
import { IconButton } from '@packages/scoutgame-ui/components/common/Button/IconButton';
import { useUserWalletAddress } from '@packages/scoutgame-ui/hooks/api/session';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { usePurchase } from '@packages/scoutgame-ui/providers/PurchaseProvider';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import type { MinimalUserInfo } from '@packages/users/interfaces';
import { isTestEnv } from '@packages/utils/constants';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';

import { useDevTokenBalance } from '../../../../hooks/useDevTokenBalance';
import { useDecentTransaction } from '../hooks/useDecentTransaction';
import { useGetBuilderNftStats } from '../hooks/useGetBuilderNftStats';
import { useGetERC20Allowance } from '../hooks/useGetERC20Allowance';
import { useGetTokenBalances } from '../hooks/useGetTokenBalances';

import { getCurrencyContract } from './ChainSelector/chains';
import type { SelectedPaymentOption } from './ChainSelector/ChainSelector';
import { BlockchainSelect } from './ChainSelector/ChainSelector';
import { ERC20ApproveButton } from './ERC20Approve';
import { NumberInputField } from './NumberField';
import { SuccessView } from './SuccessView';

export type NFTPurchaseProps = {
  builder: MinimalUserInfo & {
    price?: bigint;
    congratsImageUrl?: string | null;
    nftImageUrl?: string | null;
    nftType: BuilderNftType;
  };
};

const PRICE_POLLING_INTERVAL = 60000;

export function NFTPurchaseForm(props: NFTPurchaseProps) {
  // Waiting for component to render before fetching the API key
  const apiKey = env('DECENT_API_KEY');

  if (!apiKey && !isTestEnv) {
    return <Typography color='error'>Decent API key not found</Typography>;
  }

  return (
    <BoxHooksContextProvider apiKey={apiKey || '1234'}>
      <NFTPurchaseFormContent {...props} />
    </BoxHooksContextProvider>
  );
}

export function NFTPurchaseFormContent({ builder }: NFTPurchaseProps) {
  const season = getCurrentSeasonStart();

  const { user } = useUser();
  const builderId = builder.id;
  const initialQuantities = [1, 2, 3];
  const pricePerNft = builder.price ? Number(builder.price) / 10 ** devTokenDecimals : '';

  const { address, chainId } = useAccount();
  const { error: addressError } = useUserWalletAddress(address);
  const {
    isExecutingTransaction,
    sendMintTransactionDirectly,
    sendMintTransactionViaDecent,
    purchaseSuccess,
    purchaseError
  } = usePurchase();
  const trackEvent = useTrackEvent();

  const { switchChainAsync } = useSwitchChain();
  const { data: nftStats } = useGetBuilderNftStats({ builderId });

  const maxQuantity =
    builder.nftType === 'starter_pack' ? 1 : nftStats ? maxTokenSupply - nftStats.nftSupply.default : maxTokenSupply;
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>({
    chainId: scoutProtocolChainId,
    currency: 'DEV'
  });

  const { tokens: userTokenBalances } = useGetTokenBalances({ address: address as Address });

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [fetchError, setFetchError] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (purchaseError) {
      setSubmitError(purchaseError);
    }
  }, [purchaseError]);

  const [tokensToBuy, setTokensToBuy] = useState(1);

  // Data from onchain
  const [purchaseCost, setPurchaseCost] = useState(BigInt(0));
  const [builderTokenId, setBuilderTokenId] = useState<bigint>(BigInt(0));

  const purchaseCostInTokens = purchaseCost / BigInt(10 ** devTokenDecimals);

  const reachedMaxSupply = builder.nftType === 'default' && nftStats?.nftSupply.total === maxTokenSupply;

  const refreshAsk = useCallback(
    async ({ _builderTokenId, amount }: { _builderTokenId: bigint | number; amount: bigint | number }) => {
      const _price =
        builder.nftType === 'starter_pack'
          ? await getStarterNFTReadonlyClient()?.getTokenPurchasePrice({
              args: { amount: BigInt(amount) }
            })
          : await getNFTReadonlyClient()?.getTokenPurchasePrice({
              args: { amount: BigInt(amount), tokenId: BigInt(_builderTokenId) }
            });
      if (_price) {
        setPurchaseCost(_price);
      }
    },
    [setPurchaseCost, builder.nftType]
  );

  async function refreshTokenData() {
    setFetchError(null);
    let _builderTokenId: bigint | undefined;
    try {
      setIsFetchingPrice(true);
      _builderTokenId = await (builder.nftType === 'starter_pack'
        ? getStarterNFTReadonlyClient()?.getTokenIdForBuilder({ args: { builderId } })
        : getNFTReadonlyClient()?.getTokenIdForBuilder({ args: { builderId } }));

      // builderTokenId is undefined if there is no nft contract for the season
      if (_builderTokenId) {
        setBuilderTokenId(_builderTokenId);
        await refreshAsk({ _builderTokenId, amount: tokensToBuy });
        setIsFetchingPrice(false);
      }
    } catch (error) {
      scoutgameMintsLogger.warn('Error fetching token data', {
        error,
        builderId,
        tokenId: _builderTokenId,
        userId: user?.id
      });
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

  useEffect(() => {
    if (!builderId || isExecutingTransaction) {
      return;
    }

    refreshTokenData();

    const interval = setInterval(refreshTokenData, PRICE_POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [builderId, tokensToBuy, isExecutingTransaction]);

  const enableNftButton = !!address && !!purchaseCost && !!user;

  const contractAddress = getNFTContractAddressForNftType({ nftType: builder.nftType, season }) || '';

  const { decentSdkError, isLoadingDecentSdk, decentTransactionInfo } = useDecentTransaction({
    address: address as Address,
    builderTokenId,
    scoutId: user?.id as string,
    paymentAmountOut: purchaseCost,
    contractAddress,
    sourceChainId: selectedPaymentOption.chainId,
    sourceToken: getCurrencyContract(selectedPaymentOption),
    tokensToPurchase: BigInt(tokensToBuy),
    isStarterContract: builder.nftType === 'starter_pack'
  });

  const selectedChainCurrency = getCurrencyContract(selectedPaymentOption) as Address;

  const spender =
    selectedPaymentOption.currency === 'DEV' ? contractAddress : (decentTransactionInfo?.tx.to as Address);

  const { allowance, refreshAllowance } = useGetERC20Allowance({
    chainId: selectedPaymentOption.chainId,
    erc20Address:
      selectedPaymentOption.currency === 'USDC'
        ? selectedChainCurrency
        : selectedPaymentOption.currency === 'DEV'
          ? devTokenContractAddress
          : null,
    owner: address as Address,
    spender
  });

  const balanceInfo = userTokenBalances?.find(
    (_token) => _token.chainId === selectedPaymentOption.chainId && _token.address === selectedChainCurrency
  );

  const amountToPay = BigInt(decentTransactionInfo?.tokenPayment?.amount?.toString().replace('n', '') || 0);

  const hasInsufficientBalance = !!amountToPay && !!balanceInfo && balanceInfo.balance < amountToPay;

  const { refreshBalance } = useDevTokenBalance({ address });

  const handlePurchase = async () => {
    try {
      setSubmitError(null);

      if (chainId !== selectedPaymentOption.chainId) {
        try {
          await switchChainAsync(
            { chainId: selectedPaymentOption.chainId },
            {
              onError() {
                toast.error('Failed to switch chain');
              }
            }
          );
        } catch (error) {
          // some wallets dont support switching chain
          log.warn('Error switching chain for nft purchase', {
            chainId,
            selectedChainId: selectedPaymentOption.chainId,
            error
          });
        }
      }

      if (selectedPaymentOption.currency === 'DEV') {
        await sendMintTransactionDirectly({
          scoutId: user?.id as string,
          builderTokenId: Number(builderTokenId),
          contractAddress,
          tokensToBuy,
          isStarterContract: builder.nftType === 'starter_pack',
          purchaseCost: Number(purchaseCost),
          fromAddress: address as Address,
          builderId: builder.id
        });
      } else {
        if (!decentTransactionInfo?.tx) {
          return;
        }

        const _value = BigInt(String((decentTransactionInfo.tx as any).value || 0).replace('n', ''));

        await sendMintTransactionViaDecent({
          txData: {
            to: decentTransactionInfo.tx.to as Address,
            data: decentTransactionInfo.tx.data as any,
            value: _value
          },
          txMetadata: {
            contractAddress,
            fromAddress: address as Address,
            sourceChainId: selectedPaymentOption.chainId,
            builderTokenId: Number(builderTokenId),
            builderId: builder.id,
            purchaseCost: Number(purchaseCost),
            tokensToBuy
          }
        });
      }

      trackEvent('nft_purchase', {
        amount: tokensToBuy,
        builderPath: builder.path,
        season: getCurrentSeasonStart(),
        nftType: builder.nftType
      });

      setTimeout(() => {
        refreshBalance();
      }, 2500);
    } catch (error) {
      log.error('Error purchasing NFT', { error });
      let errorMessage = 'Something went wrong. Check your wallet is connected and has a sufficient balance';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes('insufficient')) {
          errorMessage = 'Insufficient balance';
        } else if (errorMessage.includes('reverted')) {
          errorMessage = 'Transaction reverted';
        } else if (errorMessage.includes('already in use')) {
          errorMessage = 'Address is already in use';
        } else if (errorMessage.includes('failed')) {
          errorMessage = 'Transaction failed';
        } else if (errorMessage.includes('rejected')) {
          errorMessage = 'Transaction cancelled';
        }
      }
      setSubmitError(errorMessage);
    }
  };

  const isLoading = isLoadingDecentSdk || isFetchingPrice || isExecutingTransaction;

  const displayedBalance = !balanceInfo
    ? undefined
    : selectedPaymentOption.currency === 'ETH' || selectedPaymentOption.currency === 'DEV'
      ? (Number(balanceInfo.balance || 0) / 1e18).toFixed(4)
      : (Number(balanceInfo.balance || 0) / 1e6).toFixed(2);

  const [selectedQuantity, setSelectedQuantity] = useState<number | 'custom'>(1);
  const [customQuantity, setCustomQuantity] = useState(2);

  // the # of tokens selected, regardless of whether it's a toggle or a custom quantity
  const desiredTokens = typeof selectedQuantity === 'number' ? selectedQuantity : customQuantity;

  const handleQuantityChange = (value: number | 'custom') => {
    if (builder.nftType === 'starter_pack') {
      throw new Error('Only one Starter card can be purchased at a time');
    }
    if (value === 'custom') {
      setSelectedQuantity('custom');
      setTokensToBuy(customQuantity);
    } else if (value) {
      setSelectedQuantity(value);
      if (value <= maxQuantity) {
        setTokensToBuy(value);
      }
    }
  };
  const approvalRequired =
    selectedPaymentOption.currency !== 'ETH' &&
    typeof allowance === 'bigint' &&
    allowance < (typeof amountToPay === 'bigint' ? amountToPay : BigInt(0));

  // if (approvalRequired) {
  //   log.info('Approval required for NFT purchase', {
  //     selectedPaymentOption,
  //     allowance,
  //     amountToPay,
  //     account: address,
  //     spender
  //   });
  // }

  if (purchaseSuccess) {
    return <SuccessView builder={builder} />;
  }

  return (
    <Stack gap={2} width='400px' maxWidth='100%' mx='auto'>
      <Box
        bgcolor='black.dark'
        width='100%'
        pt={2}
        pb={1}
        display='flex'
        alignItems='center'
        flexDirection='column'
        gap={1}
      >
        {builder.nftImageUrl ? (
          <Image
            src={builder.nftImageUrl}
            alt={builder.path}
            width={200}
            height={300}
            style={{ aspectRatio: '1/1.4', width: '40%', height: '50%' }}
          />
        ) : (
          <Image src='/images/no_nft_person.png' alt='no nft image available' width={200} height={200} />
        )}
        <Typography textAlign='center' fontWeight={600} color='secondary'>
          <>
            {pricePerNft}{' '}
            <Box component='span' display='inline' position='relative' top={4}>
              <Image src='/images/dev-token-logo.png' alt='DEV token' width={18} height={18} />
            </Box>
          </>
        </Typography>
      </Box>
      {nftStats?.builderStrikes ? (
        <Alert severity='warning'>
          This builder has {nftStats.builderStrikes} strike{nftStats.builderStrikes > 1 ? 's' : ''}. Click{' '}
          <Link href='/info/spam-policy' target='_blank'>
            here
          </Link>{' '}
          to learn more.
        </Alert>
      ) : null}
      {builder.nftType === 'default' && (
        <Stack gap={1}>
          <Typography color='secondary'>Select quantity</Typography>
          <ToggleButtonGroup
            value={selectedQuantity}
            onChange={(_, newValue) => handleQuantityChange(newValue)}
            exclusive
            fullWidth
            aria-label='quantity selection'
          >
            {initialQuantities.map((q) => (
              <ToggleButton sx={{ minWidth: 60, minHeight: 40 }} key={q} value={q} aria-label={q.toString()}>
                {q}
              </ToggleButton>
            ))}
            <ToggleButton sx={{ fontSize: 14, textTransform: 'none' }} value='custom' aria-label='custom'>
              Custom
            </ToggleButton>
          </ToggleButtonGroup>
          {selectedQuantity === 'custom' && (
            <Stack flexDirection='row' gap={2} mt={2}>
              <IconButton
                color='secondary'
                onClick={() => {
                  const newQuantity = Math.max(1, customQuantity - 1);
                  setCustomQuantity(newQuantity);
                  setTokensToBuy(newQuantity);
                }}
              >
                -
              </IconButton>
              <NumberInputField
                fullWidth
                color='secondary'
                id='builderId'
                type='number'
                placeholder='Quantity'
                value={customQuantity}
                error={customQuantity > maxQuantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!Number.isNaN(value) && value > 0) {
                    setCustomQuantity(value);
                    if (value <= maxQuantity) {
                      setTokensToBuy(value);
                    }
                  }
                }}
                disableArrows
                sx={{ '& input': { textAlign: 'center' } }}
              />
              <IconButton
                color='secondary'
                disabled={tokensToBuy >= maxQuantity}
                onClick={() => {
                  setCustomQuantity((prev) => prev + 1);
                  setTokensToBuy((prev) => prev + 1);
                }}
              >
                +
              </IconButton>
            </Stack>
          )}
          <Stack direction='row' justifyContent='space-between'>
            <Typography align='right' variant='caption' color={desiredTokens > maxQuantity ? 'error' : 'secondary'}>
              {desiredTokens > maxQuantity ? `Remaining supply: ${maxQuantity}` : ''}
            </Typography>
            {nftStats ? (
              <Typography align='right' variant='caption' color='secondary'>
                {tokensToBuy} out of {nftStats.nftSupply.total + tokensToBuy} Cards. Reward:{' '}
                {calculateFutureReward({
                  nftSupply: nftStats.nftSupply,
                  nftType: builder.nftType,
                  tokensToBuy
                })}
                %
              </Typography>
            ) : (
              <Typography align='right' variant='caption'>
                <CircularProgress color='inherit' size={14} />
              </Typography>
            )}
          </Stack>
        </Stack>
      )}
      <Stack>
        <Stack flexDirection='row' alignItems='center' gap={0.5} mb={1}>
          <Typography color='secondary'>Total cost</Typography>
          {builder.nftType === 'default' && (
            <Link href='/info/developer-nfts' target='_blank' title='Read how Developer cards are priced'>
              <InfoIcon sx={{ color: 'secondary.main', fontSize: 16, opacity: 0.7 }} />
            </Link>
          )}
        </Stack>
        <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
          <Typography variant='caption' color='secondary' align='left' sx={{ width: '50%' }}>
            Qty
          </Typography>
          <Typography variant='caption' color='secondary' align='left' flexGrow={1}>
            DEV
          </Typography>
        </Stack>
        <Stack flexDirection='row' justifyContent='space-between'>
          <Typography sx={{ width: '50%' }}>{tokensToBuy} Card</Typography>
          <Typography align='left' flexGrow={1}>
            {purchaseCost && (
              <>
                {purchaseCostInTokens.toLocaleString()}{' '}
                <Box component='span' display='inline' position='relative' top={4}>
                  <Image src='/images/dev-token-logo.png' alt='DEV token' width={18} height={18} />
                </Box>
              </>
            )}
            {isFetchingPrice && <CircularProgress size={16} />}
          </Typography>
        </Stack>
      </Stack>
      <Stack>
        <Typography color='secondary'>Select payment</Typography>
        <>
          <BlockchainSelect
            value={selectedPaymentOption}
            balance={displayedBalance}
            address={address}
            userTokenBalances={userTokenBalances}
            onSelectChain={(_paymentOption) => {
              setSelectedPaymentOption(_paymentOption);
            }}
          />
          {hasInsufficientBalance ? (
            <Typography sx={{ mt: 1 }} variant='caption' color='error' align='center'>
              Insufficient balance
            </Typography>
          ) : null}
        </>
      </Stack>

      {fetchError && (
        <Typography variant='caption' color='error' align='center'>
          {fetchError.shortMessage || 'Something went wrong'}
        </Typography>
      )}
      {decentSdkError ? (
        <Typography variant='caption' color='error' align='center'>
          {decentSdkError.message || 'There was an error communicating with Decent API'}
        </Typography>
      ) : null}
      {addressError && (
        <Typography variant='caption' color='error' align='center' data-test='address-error'>
          {'message' in addressError
            ? addressError.message
            : `Address ${address} is already in use. Please connect a different wallet`}
        </Typography>
      )}
      {submitError && (
        <Typography variant='caption' color='error' align='center'>
          {submitError}
        </Typography>
      )}

      {reachedMaxSupply ? (
        <Button disabled variant='buy'>
          <Box px={1}>SOLD OUT</Box>
        </Button>
      ) : !approvalRequired || isExecutingTransaction || isFetchingPrice ? (
        <Button
          loading={isLoading}
          size='large'
          onClick={handlePurchase}
          variant='contained'
          disabled={
            !enableNftButton ||
            isLoadingDecentSdk ||
            isFetchingPrice ||
            !scoutgameEthAddress ||
            isExecutingTransaction ||
            addressError ||
            hasInsufficientBalance
          }
          data-test='purchase-button'
        >
          {isFetchingPrice ? 'Updating Price...' : 'Buy'}
        </Button>
      ) : (
        <ERC20ApproveButton
          spender={spender}
          chainId={selectedPaymentOption.chainId}
          erc20Address={getCurrencyContract(selectedPaymentOption) as Address}
          amount={
            selectedPaymentOption.currency === 'DEV'
              ? BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935')
              : amountToPay
          }
          onSuccess={async () => {
            try {
              // Ensure we're on the right chain before proceeding
              if (chainId !== selectedPaymentOption.chainId) {
                await switchChainAsync({ chainId: selectedPaymentOption.chainId });
              }
              refreshAllowance();
              // Wait a bit before triggering purchase to ensure approval is processed
              if (selectedPaymentOption.currency === 'DEV') {
                setTimeout(() => {
                  handlePurchase();
                }, 1000);
              }
            } catch (error) {
              log.warn('Error during post-approval steps', { error });
            }
          }}
          decimals={selectedPaymentOption.currency === 'USDC' ? 6 : devTokenDecimals}
          currency={selectedPaymentOption.currency}
          actionType='mint'
          hideWarning
        />
      )}
    </Stack>
  );
}

function calculateFutureReward({
  nftSupply,
  nftType,
  tokensToBuy
}: {
  nftSupply: { default: number; starterPack: number };
  nftType: BuilderNftType;
  tokensToBuy: number;
}) {
  let rewardPercent: bigint;
  const scoutsRewardPool = BigInt(100);

  if (nftType === 'starter_pack') {
    rewardPercent = calculateRewardForScout({
      purchased: { starterPack: tokensToBuy },
      supply: {
        ...nftSupply,
        starterPack: nftSupply.starterPack + tokensToBuy
      },
      scoutsRewardPool
    });
  } else {
    rewardPercent = calculateRewardForScout({
      purchased: { default: tokensToBuy },
      supply: {
        ...nftSupply,
        default: nftSupply.default + tokensToBuy
      },
      scoutsRewardPool
    });
  }
  return Math.floor(Number(rewardPercent));
}
