import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import { Box, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { useCreateProposalRewards } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { RewardTokenInfo } from 'components/rewards/components/RewardProperties/components/RewardTokenInfo';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalPendingReward } from 'lib/proposal/blocks/interfaces';

export type Props = {
  disabled: boolean;
  proposalId?: string;
  pendingRewards: ProposalPendingReward[] | undefined;
  onSubmit?: VoidFunction;
};

export function PublishRewardsButton({ proposalId, pendingRewards, disabled, onSubmit }: Props) {
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const { trigger, isMutating } = useCreateProposalRewards(proposalId);
  const { showMessage } = useSnackbar();
  const { mappedFeatures } = useSpaceFeatures();
  const rewardsTitle = mappedFeatures.rewards.title;

  async function createRewards() {
    try {
      await trigger();
      showMessage(`${rewardsTitle} created`, 'success');
      onSubmit?.();
      // mutateRewards();
    } catch (e) {
      showMessage((e as any).message, 'error');
    }
  }

  return (
    <>
      {pendingRewards?.map(({ reward, page, draftId }) => (
        <Box display='flex' alignItems='center' gap={1} key={draftId} mb={2}>
          <Typography component='span' variant='subtitle1' fontWeight='normal'>
            {page?.title || 'Untitled'}
          </Typography>
          <Stack alignItems='center' direction='row' height='100%'>
            {reward.customReward ? (
              <Typography component='span' variant='subtitle1' fontWeight='normal'>
                {reward.customReward}
              </Typography>
            ) : (
              <RewardTokenInfo
                chainId={reward.chainId || null}
                symbolOrAddress={reward.rewardToken || null}
                rewardAmount={reward.rewardAmount || null}
              />
            )}
          </Stack>
        </Box>
      ))}
      <Box display='flex' justifyContent='flex-end'>
        <Button
          disabled={disabled}
          disabledTooltip={`Only reviewers can publish ${rewardsTitle}`}
          loading={isMutating}
          onClick={() => setShowConfirmation(true)}
        >
          Publish {rewardsTitle}
        </Button>
        <ModalWithButtons
          open={showConfirmation}
          title={`Publish ${rewardsTitle}?`}
          buttonText='Publish'
          onClose={() => setShowConfirmation(false)}
          // wrap the function so it does not return a promise to the confirmation modal
          onConfirm={() => createRewards()}
        >
          <Typography>This action cannot be done</Typography>
        </ModalWithButtons>
      </Box>
    </>
  );
}
