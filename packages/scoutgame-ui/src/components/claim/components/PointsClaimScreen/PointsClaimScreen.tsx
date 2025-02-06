'use client';

import { log } from '@charmverse/core/log';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Box, Dialog, IconButton, Paper, Stack, Typography } from '@mui/material';
import { getPlatform } from '@packages/mixpanel/platform';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import { getProtocolReadonlyClient } from '@packages/scoutgame/builderNfts/clients/protocol/getProtocolReadonlyClient';
import type { ClaimData } from '@packages/scoutgame/points/getClaimableTokensWithSources';
import { scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import { useWalletClient } from 'wagmi';

import { claimPointsAction } from '../../../../actions/claimPointsAction';
import { handleOnchainClaimAction } from '../../../../actions/handleOnchainClaimAction';
import { handlePartnerRewardClaimAction } from '../../../../actions/handlePartnerRewardClaimAction';
import { revalidateClaimPointsAction } from '../../../../actions/revalidateClaimPointsAction';
import { useUser } from '../../../../providers/UserProvider';
import { WalletLogin } from '../../../common/WalletLogin/WalletLogin';

import { BonusPartnersDisplay } from './BonusPartnersDisplay';
import { PointsClaimSocialShare } from './PointsClaimModal/PointsClaimSocialShare';
import { RewardsClaimButton } from './RewardsClaimButton';

export function PointsClaimScreen({
  totalUnclaimedPoints,
  bonusPartners,
  partnerRewards,
  builders,
  repos,
  onchainClaimData,
  processingPayouts
}: {
  totalUnclaimedPoints: number;
  bonusPartners: BonusPartner[];
  partnerRewards: {
    id: string;
    amount: number;
    partner: string;
  }[];
  builders: {
    farcasterHandle?: string;
    displayName: string;
  }[];
  repos: string[];
  onchainClaimData?: ClaimData;
  processingPayouts: boolean;
}) {
  const { executeAsync: claimPoints, isExecuting, result } = useAction(claimPointsAction);
  const { executeAsync: handleOnchainClaim } = useAction(handleOnchainClaimAction, {
    onSuccess() {
      toast.success('You claimed your points successfully');
    },
    onError(error) {
      toast.error(error.error.serverError?.message || 'There was an error while claiming points');
    }
  });
  const { executeAsync: handlePartnerRewardClaim, isExecuting: isPartnerRewardClaiming } = useAction(
    handlePartnerRewardClaimAction,
    {
      onSuccess() {
        toast.success('You claimed your partner reward successfully');
      },
      onError(error) {
        toast.error(error.error.serverError?.message || 'There was an error while claiming partner reward');
      }
    }
  );
  const { refreshUser, user } = useUser();
  const [showModal, setShowModal] = useState(false);
  const { executeAsync: revalidateClaimPoints } = useAction(revalidateClaimPointsAction);

  const { data: walletClient } = useWalletClient();

  const handleClaim = async () => {
    await claimPoints();
    await refreshUser();
    // only show the modal if there's something worth showing, eg points only came from selling NFTs
    if (builders.length > 0 || repos.length > 0) {
      setShowModal(true);
    } else {
      await revalidateClaimPoints();
    }
  };

  async function handleWalletClaim() {
    if (!walletClient) {
      log.warn('No wallet client found');
      return;
    }

    if (walletClient.chain.id !== scoutProtocolChainId) {
      await walletClient.switchChain({
        id: scoutProtocolChainId
      });
    }

    const protocolClient = getProtocolReadonlyClient();

    const tx = await protocolClient.multiClaim({
      args: {
        claims: onchainClaimData?.weeklyProofs?.map((claim) => ({
          week: claim.week,
          amount: BigInt(claim.amount),
          proofs: claim.proofs
        }))
      }
    });

    await handleOnchainClaim({
      wallet: walletClient.account.address.toLowerCase(),
      claimsProofs: onchainClaimData!.weeklyProofs,
      claimTxHash: tx.transactionHash
    });

    refreshUser();
  }

  const handleCloseModal = async () => {
    setShowModal(false);
    await revalidateClaimPoints();
  };

  const connectedAddress = walletClient?.account.address.toLowerCase();

  const platform = getPlatform();

  return (
    <Paper
      sx={{
        gap: 1,
        padding: 4,
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
      {(totalUnclaimedPoints || partnerRewards.length > 0) && !processingPayouts ? (
        <>
          <Typography variant='h5' textAlign='center' fontWeight={500} color='secondary'>
            Congratulations!
          </Typography>
          {totalUnclaimedPoints ? (
            <>
              <Typography variant='h5' textAlign='center'>
                You have earned Scout {platform === 'onchain_webapp' ? 'Tokens' : 'Points'}!
              </Typography>

              <Stack
                sx={{
                  flexDirection: {
                    xs: 'row',
                    md: 'column'
                  },
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
                      {totalUnclaimedPoints.toLocaleString()}
                    </Typography>
                    <Image
                      width={35}
                      height={35}
                      style={{ marginRight: 10 }}
                      src='/images/profile/scout-game-icon.svg'
                      alt='Scouts'
                    />{' '}
                    {bonusPartners.length > 0 ? '+ ' : ''}
                    <BonusPartnersDisplay bonusPartners={bonusPartners} size={35} />
                  </Stack>
                </Stack>
                <Box width={{ xs: 'fit-content', md: '100%' }}>
                  {onchainClaimData ? (
                    connectedAddress !== onchainClaimData.address.toLowerCase() ? (
                      <WalletLogin />
                    ) : (
                      <RewardsClaimButton isExecuting={false} handleClaim={handleWalletClaim} />
                    )
                  ) : null}
                  {!onchainClaimData && <RewardsClaimButton isExecuting={isExecuting} handleClaim={handleClaim} />}
                </Box>
              </Stack>
            </>
          ) : null}
          {partnerRewards.length > 0 ? (
            <>
              <Typography variant='h6' mt={1} textAlign='center' fontWeight={500} color='secondary'>
                Partner Rewards
              </Typography>
              {partnerRewards.map((reward) => (
                <Stack
                  key={reward.id}
                  flexDirection='row'
                  width='100%'
                  alignItems='center'
                  justifyContent='space-between'
                  gap={1}
                >
                  <Typography>
                    {reward.partner === 'optimism_new_scout_partner' ? 'New Scout Partner' : 'Referral Champion'}
                  </Typography>
                  <Stack flexDirection='row' alignItems='center' gap={1}>
                    <Typography>{reward.amount.toLocaleString()}</Typography>
                    <Image width={25} height={25} src='/images/crypto/op.png' alt='Scouts' />
                  </Stack>
                  <RewardsClaimButton
                    isExecuting={isPartnerRewardClaiming}
                    handleClaim={() => handlePartnerRewardClaim({ payoutId: reward.id })}
                  />
                </Stack>
              ))}
            </>
          ) : null}
        </>
      ) : null}
      {!totalUnclaimedPoints && !processingPayouts ? (
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
                src={`https://cdn.charmverse.io/points-claim/${user.id}/${result.data.week}.png`}
                alt='Claim success modal'
              />
            </Stack>
            <Stack width='100%'>
              <PointsClaimSocialShare
                isBuilder={repos.length > 0}
                totalUnclaimedPoints={result.data.claimedPoints}
                builders={builders}
                userPath={user.path}
                week={result.data.week}
              />
            </Stack>
          </>
        ) : null}
      </Dialog>
    </Paper>
  );
}
