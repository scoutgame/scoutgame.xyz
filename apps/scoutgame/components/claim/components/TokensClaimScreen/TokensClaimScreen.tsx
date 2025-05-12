'use client';

import { log } from '@charmverse/core/log';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Box, Dialog, IconButton, Paper, Stack, Typography } from '@mui/material';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getLastWeek } from '@packages/dates/utils';
import { partnerRewardRecord } from '@packages/scoutgame/partnerRewards/constants';
import type { UnclaimedPartnerReward } from '@packages/scoutgame/partnerRewards/getPartnerRewardsForScout';
import { getProtocolWriteClient } from '@packages/scoutgame/protocol/clients/getProtocolWriteClient';
import { devTokenDecimals, scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
import type { ReadWriteWalletClient } from '@packages/scoutgame/protocol/contracts/ScoutProtocolImplementation';
import type { ClaimInput } from '@packages/scoutgame/tokens/getClaimableTokensWithSources';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { WalletLogin } from '@packages/scoutgame-ui/components/common/WalletLogin/WalletLogin';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { ceilToPrecision } from '@packages/utils/numbers';
import { shortenHex } from '@packages/utils/strings';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { formatUnits } from 'viem';
import { base } from 'viem/chains';
import { useWalletClient } from 'wagmi';

import { handleOnchainClaimAction } from 'lib/actions/handleOnchainClaimAction';
import { revalidateClaimTokensAction } from 'lib/actions/revalidateClaimTokensAction';

import { BonusPartnersDisplay } from './BonusPartnersDisplay';
import { PartnerRewardsClaimButton } from './PartnerRewardsClaimButton/PartnerRewardsClaimButton';
import { TokensClaimButton } from './TokensClaimButton';
import { TokensClaimSocialShare } from './TokensClaimModal/TokensClaimSocialShare';

type TokensClaimScreenProps = {
  partnerRewards: UnclaimedPartnerReward[];
  developers: {
    farcasterHandle?: string;
    displayName: string;
  }[];
  repos: string[];
  onchainClaims: Record<Address, ClaimInput[]>;
  processingPayouts: boolean;
  totalUnclaimedTokens: number;
};

export function TokensClaimScreen(props: TokensClaimScreenProps) {
  return (
    <RainbowKitProvider>
      <TokensClaimScreenComponent {...props} />
    </RainbowKitProvider>
  );
}

function TokensClaimScreenComponent({
  partnerRewards,
  developers,
  repos,
  totalUnclaimedTokens,
  onchainClaims,
  processingPayouts
}: TokensClaimScreenProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const { executeAsync: handleOnchainClaim, result } = useAction(handleOnchainClaimAction, {
    onSuccess() {
      toast.success('You claimed your tokens successfully');
    },
    onError(error) {
      toast.error(error.error.serverError?.message || 'There was an error while claiming tokens');
    }
  });

  const { refreshUser, user } = useUser();
  const [showModal, setShowModal] = useState(false);

  const { executeAsync: revalidateClaimTokens } = useAction(revalidateClaimTokensAction);

  const { data: walletClient } = useWalletClient();

  const bonusPartners = partnerRewards.map((reward) => reward.partner);

  // use last week as claims can span multiple weeks
  const week = getLastWeek();

  async function handleWalletClaim() {
    if (!walletClient) {
      log.warn('No wallet client found');
      return;
    }

    if (walletClient.chain.id !== scoutProtocolChainId) {
      try {
        await walletClient.switchChain({
          id: scoutProtocolChainId
        });
      } catch (error) {
        // some wallets dont support switching chain
        log.warn('Error switching chain for tokens claim', { error });
      }
    }

    setIsExecuting(true);

    try {
      const protocolClient = getProtocolWriteClient({
        walletClient: walletClient as ReadWriteWalletClient
      });

      const weeklyProofs = onchainClaims[walletClient.account.address.toLowerCase()];

      const tx = await protocolClient.multiClaim({
        args: {
          claims: weeklyProofs?.map((claim) => ({
            week: claim.week,
            amount: claim.amount,
            proofs: claim.proofs
          }))
        }
      });

      const publicClient = getPublicClient(base.id);

      await publicClient.waitForTransactionReceipt({
        hash: tx as `0x${string}`,
        retryCount: 10
      });

      await handleOnchainClaim({
        wallet: walletClient.account.address.toLowerCase(),
        claimsProofs: weeklyProofs?.map((proof) => ({
          week: proof.week,
          amount: proof.amount.toString(),
          proofs: proof.proofs
        })),
        claimTxHash: tx
      });

      await refreshUser();
    } catch (error) {
      log.error('Error claiming tokens', { error });
    } finally {
      setIsExecuting(false);
    }
  }

  const handleCloseModal = async () => {
    setShowModal(false);
    await revalidateClaimTokens();
  };

  const connectedAddress = walletClient?.account.address.toLowerCase();

  return (
    <Paper
      sx={{
        gap: 1,
        padding: {
          xs: 2,
          md: 4
        },
        borderRadius: 2,
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      {processingPayouts && (
        <>
          <Typography variant='h5' textAlign='center' fontWeight={500} color='secondary'>
            Processing payouts
          </Typography>
          <Typography variant='body1' textAlign='center'>
            We are currently processing payouts for last week. Please check back in a few minutes.
          </Typography>
        </>
      )}
      {(totalUnclaimedTokens || partnerRewards.length > 0) && !processingPayouts ? (
        <>
          <Typography variant='h5' textAlign='center' fontWeight={500} color='secondary'>
            Congratulations!
          </Typography>
          {totalUnclaimedTokens ? (
            <>
              <Typography variant='h5' textAlign='center'>
                You have earned DEV Tokens!
              </Typography>

              <Stack
                sx={{
                  flexDirection: 'column',
                  gap: 1,
                  justifyContent: 'space-between',
                  width: '100%',
                  alignItems: 'center'
                }}
              >
                <Stack flexDirection='column' alignItems='center' gap={0.5}>
                  <Typography variant='h6'>
                    <b>{user?.displayName}</b> <span style={{ fontSize: '0.8em' }}>will receive</span>
                  </Typography>
                  <Stack flexDirection='row' alignItems='center' gap={1}>
                    <Typography variant='h4' fontWeight={500}>
                      {ceilToPrecision(totalUnclaimedTokens, 4)}
                    </Typography>
                    <Image
                      width={35}
                      height={35}
                      style={{ marginRight: 10 }}
                      src='/images/dev-token-logo.png'
                      alt='DEV Token'
                    />{' '}
                    {bonusPartners.length > 0 ? '+ ' : ''}
                    <BonusPartnersDisplay bonusPartners={bonusPartners} size={35} />
                  </Stack>
                </Stack>
                <Box width='100%' my={1} display='flex' justifyContent='center' flexDirection='column' gap={2.5}>
                  {Object.entries(onchainClaims).map(([address, claims]) => (
                    <Stack
                      flexDirection='row'
                      justifyContent='space-between'
                      alignItems='center'
                      gap={1}
                      width='100%'
                      key={address}
                    >
                      <Stack flexDirection='column' gap={0.5}>
                        <Stack flexDirection='row' alignItems='center' gap={1}>
                          <Image
                            src='/images/dev-token-logo.png'
                            width={18}
                            height={18}
                            alt='DEV token icon'
                            priority={true}
                          />
                          <Typography>
                            {ceilToPrecision(
                              Number(
                                formatUnits(
                                  claims.reduce((acc, claim) => acc + BigInt(claim.amount), BigInt(0)),
                                  devTokenDecimals
                                )
                              ),
                              4
                            )}
                          </Typography>
                        </Stack>
                        <Typography>{shortenHex(address, 6)}</Typography>
                      </Stack>
                      <Stack maxWidth={150}>
                        {connectedAddress !== address ? (
                          <WalletLogin key={address} text='Sign in' size='small' />
                        ) : (
                          <TokensClaimButton key={address} isExecuting={isExecuting} handleClaim={handleWalletClaim} />
                        )}
                      </Stack>
                    </Stack>
                  ))}
                </Box>
              </Stack>
            </>
          ) : null}
          {partnerRewards.length > 0 ? (
            <>
              <Typography variant='h6' mt={1} textAlign='center' fontWeight={500} color='secondary'>
                Partner Rewards
              </Typography>
              <Stack gap={2} width='100%'>
                {partnerRewards.map((reward) => (
                  <Stack key={reward.id} flexDirection='row' alignItems='center' justifyContent='space-between'>
                    <Typography
                      width={{
                        xs: 150,
                        md: 200
                      }}
                    >
                      {partnerRewardRecord[reward.partner].label} (Week {reward.week})
                    </Typography>
                    <Stack flexDirection='row' alignItems='center' gap={1}>
                      <Typography>{reward.amount.toLocaleString()}</Typography>
                      <Image width={25} height={25} src={partnerRewardRecord[reward.partner].icon} alt='Scouts' />
                    </Stack>
                    <PartnerRewardsClaimButton
                      partnerReward={reward}
                      chain={partnerRewardRecord[reward.partner].chain}
                    />
                  </Stack>
                ))}
              </Stack>
            </>
          ) : null}
        </>
      ) : null}
      {!totalUnclaimedTokens && partnerRewards.length === 0 && !processingPayouts ? (
        <>
          <Typography textAlign='center' color='secondary' variant='h5'>
            Hey {user?.displayName},
          </Typography>
          <Typography textAlign='center' variant='h6'>
            You have no rewards to claim.
            <br />
            Keep playing to earn more!
          </Typography>
        </>
      ) : null}

      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        data-test='claim-points-success-modal'
        PaperProps={{
          sx: {
            width: '100%'
          }
        }}
      >
        <IconButton onClick={handleCloseModal} sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1, m: 1 }}>
          <CancelOutlinedIcon color='primary' />
        </IconButton>
        {result.data && user ? (
          <>
            <Stack
              sx={{
                width: '100%',
                height: '100%',
                aspectRatio: '1/1',
                maxWidth: 600,
                maxHeight: 600,
                position: 'relative'
              }}
            >
              <img
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
                src={`https://cdn.charmverse.io/tokens-claim/${user.id}/${week}.png`}
                alt='Claim success modal'
              />
            </Stack>
            <Stack width='100%'>
              <TokensClaimSocialShare
                isBuilder={repos.length > 0}
                totalUnclaimedTokens={totalUnclaimedTokens}
                developers={developers}
                userPath={user.path}
                week={week}
              />
            </Stack>
          </>
        ) : null}
      </Dialog>
    </Paper>
  );
}
