import type { Bounty as Reward } from '@charmverse/core/prisma';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import RewardIcon from '@mui/icons-material/RequestPageOutlined';
import { IconButton, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import { getChainById } from 'connectors/chains';
import millify from 'millify';
import Link from 'next/link';

import TokenLogo from 'components/common/TokenLogo';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from 'lib/tokens/tokenData';
import { fancyTrim } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';

import { RewardStatusChip } from './RewardChip';

export interface IRewardBadgeProps {
  reward: Reward;
  truncate?: boolean;
  hideStatus?: boolean;
  showEmptyStatus?: boolean;
}
export function RewardStatusBadge({ truncate = false, showEmptyStatus, hideStatus, reward }: IRewardBadgeProps) {
  return (
    <Grid container direction='column' alignItems='center'>
      <Grid item xs width='100%' display='flex' flexDirection='column' sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: '100%',
            justifyContent: 'space-between',
            gap: 1,
            alignItems: 'center',
            minHeight: '30px'
          }}
        >
          <RewardAmount reward={reward} truncate={truncate} />
          {!hideStatus && <RewardStatusChip status={reward.status} showEmptyStatus={showEmptyStatus} />}
        </Box>
      </Grid>
    </Grid>
  );
}

export function RewardAmount({
  reward,
  truncate = false
}: {
  reward: Pick<Reward, 'rewardAmount' | 'rewardToken' | 'chainId' | 'customReward'>;
  truncate?: boolean;
}) {
  const [paymentMethods] = usePaymentMethods();

  if (reward.customReward) {
    return (
      <Tooltip title={reward.customReward}>
        <Stack flexDirection='row' gap={0.5} alignItems='center'>
          <RewardIcon fontSize='small' color='secondary' />
          <Typography>{fancyTrim(reward.customReward, 15)}</Typography>
        </Stack>
      </Tooltip>
    );
  }

  if (!isTruthy(reward.rewardAmount) || !isTruthy(reward.rewardToken) || !isTruthy(reward.chainId)) {
    return null;
  }

  const rewardAmount = reward.rewardAmount;
  const rewardToken = reward.rewardToken;
  const chainId = reward.chainId;

  const tokenInfo = getTokenInfo({
    chainId,
    methods: paymentMethods,
    symbolOrAddress: rewardToken
  });

  const formattedAmount = Intl.NumberFormat(undefined, { maximumSignificantDigits: 3 }).format(rewardAmount);

  const truncatedAmount = () => {
    try {
      return millify(rewardAmount, { precision: 4 });
    } catch (error) {
      return 'Invalid number';
    }
  };
  const chain = reward.chainId ? getChainById(reward.chainId) : undefined;
  const tooltip = `${formattedAmount} ${tokenInfo.tokenSymbol} ${chain ? `on ${chain.chainName}` : ''}`;

  return (
    <Tooltip arrow placement='top' title={rewardAmount === 0 ? '' : tooltip}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
        {rewardAmount === 0 ? (
          <Box sx={{ display: 'flex', verticalAlign: 'middle' }}>
            <Typography
              component='span'
              sx={{
                fontWeight: 600
              }}
              mr={0.5}
              variant='caption'
            >
              Reward not set
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              component='span'
              sx={{
                width: 25,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <TokenLogo height={20} src={tokenInfo.canonicalLogo} />
            </Box>
            <Typography
              component='span'
              sx={{
                fontWeight: 600
              }}
              variant='h6'
              fontSize={18}
              data-test='reward-amount'
              textTransform='uppercase'
            >
              {truncate ? truncatedAmount() : rewardAmount} {tokenInfo.isContract && tokenInfo.tokenSymbol}
            </Typography>
          </>
        )}
      </Box>
    </Tooltip>
  );
}
