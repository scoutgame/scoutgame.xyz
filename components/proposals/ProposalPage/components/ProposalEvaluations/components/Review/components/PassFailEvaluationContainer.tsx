import PanToolIcon from '@mui/icons-material/PanTool';
import { Box, Card, FormLabel, Stack, TextField, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';

import {
  useAppealProposalEvaluation,
  useResetEvaluationAppealReview,
  useResetEvaluationReview,
  useSubmitEvaluationAppealReview,
  useSubmitEvaluationReview
} from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import MultiTabs from 'components/common/MultiTabs';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { getActionButtonLabels } from 'lib/proposals/getActionButtonLabels';
import type { PopulatedEvaluation } from 'lib/proposals/interfaces';
import { getRelativeTimeInThePast } from 'lib/utils/dates';

import type { PassFailEvaluationProps } from './PassFailEvaluation';
import { PassFailEvaluation } from './PassFailEvaluation';

type Props = {
  hideReviewer?: boolean;
  proposalId?: string;
  authors: string[];
  evaluation: Pick<
    PopulatedEvaluation,
    | 'id'
    | 'completedAt'
    | 'reviewers'
    | 'result'
    | 'isReviewer'
    | 'actionLabels'
    | 'requiredReviews'
    | 'reviews'
    | 'declineReasonOptions'
    | 'appealable'
    | 'appealRequiredReviews'
    | 'appealReviewers'
    | 'type'
    | 'appealedAt'
    | 'appealedBy'
    | 'declinedAt'
    | 'isAppealReviewer'
    | 'appealReviews'
    | 'appealReason'
  >;
  refreshProposal?: VoidFunction;
  confirmationMessage?: string;
  isCurrent: boolean;
  archived?: boolean;
};
export function PassFailEvaluationContainer({
  proposalId,
  hideReviewer,
  evaluation,
  isCurrent,
  refreshProposal,
  confirmationMessage,
  archived,
  authors
}: Props) {
  const appealReasonPopupState = usePopupState({
    variant: 'dialog'
  });
  const [appealReason, setAppealReason] = useState<string | null>(null);

  const [evaluationTab, setEvaluationTab] = useState<number>(0);
  const { user } = useUser();
  const { membersRecord } = useMembers();
  const canAppeal =
    evaluation.appealable &&
    !evaluation.appealedAt &&
    isCurrent &&
    evaluation.result === 'fail' &&
    user &&
    authors.includes(user.id);
  const { trigger: submitEvaluationReview, isMutating: isSubmittingEvaluationReview } = useSubmitEvaluationReview({
    proposalId
  });
  const { trigger: submitEvaluationAppealReview, isMutating: isSubmittingEvaluationAppealReview } =
    useSubmitEvaluationAppealReview({ evaluationId: evaluation.id });
  const { trigger: resetEvaluationReview, isMutating: isResettingEvaluationReview } = useResetEvaluationReview({
    proposalId
  });
  const { trigger: resetEvaluationAppealReview, isMutating: isResettingEvaluationAppealReview } =
    useResetEvaluationAppealReview({
      evaluationId: evaluation.id
    });
  const { trigger: appealProposalEvaluation, isMutating: isAppealingProposalEvaluation } = useAppealProposalEvaluation({
    evaluationId: evaluation.id
  });

  useEffect(() => {
    if (evaluation.appealedAt) {
      setEvaluationTab(1);
    }
  }, [evaluation.appealedAt]);

  const { showMessage } = useSnackbar();
  const actionLabels = getActionButtonLabels(evaluation);

  async function onSubmitEvaluationReview(
    declineReason: string | null,
    result: NonNullable<PopulatedEvaluation['result']>
  ) {
    try {
      await submitEvaluationReview({
        evaluationId: evaluation.id,
        result,
        declineReasons: declineReason ? [declineReason] : []
      });
      refreshProposal?.();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }

  async function onSubmitEvaluationAppealReview(
    declineReason: string | null,
    result: NonNullable<PopulatedEvaluation['result']>
  ) {
    try {
      await submitEvaluationAppealReview({
        result,
        declineReasons: declineReason ? [declineReason] : []
      });
      refreshProposal?.();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }

  async function onResetEvaluationAppealReview() {
    resetEvaluationAppealReview().then(refreshProposal);
  }

  function onResetEvaluationReview() {
    resetEvaluationReview({
      evaluationId: evaluation.id
    }).then(refreshProposal);
  }

  function closeAppealReasonPopup() {
    setAppealReason(null);
    appealReasonPopupState.close();
  }

  function onAppealProposalEvaluation() {
    if (!appealReason) {
      return;
    }
    appealProposalEvaluation({
      appealReason
    })
      .then(refreshProposal)
      .finally(closeAppealReasonPopup);
  }

  const passFailProps: PassFailEvaluationProps = {
    confirmationMessage,
    hideReviewer,
    isCurrent,
    isReviewer: evaluation.isReviewer,
    archived,
    onSubmitEvaluationReview,
    onResetEvaluationReview: evaluation.appealedAt ? undefined : onResetEvaluationReview,
    isResettingEvaluationReview,
    reviewerOptions: evaluation.reviewers.map((reviewer) => ({
      group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
      id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
    })),
    isSubmittingReview: isSubmittingEvaluationReview,
    evaluationReviews: evaluation.reviews,
    requiredReviews: evaluation.requiredReviews,
    evaluationResult: evaluation.appealedAt ? 'fail' : evaluation.result,
    declineReasonOptions: evaluation.declineReasonOptions,
    completedAt: evaluation.appealedAt ? evaluation.declinedAt : evaluation.completedAt,
    actionLabels
  };

  if (evaluation.appealedAt) {
    return (
      <MultiTabs activeTab={evaluationTab} setActiveTab={setEvaluationTab} tabs={['Evaluation', 'Appeal']}>
        {({ value }) => (
          <Stack mt={2}>
            {value === 'Evaluation' && <PassFailEvaluation {...passFailProps} />}
            {value === 'Appeal' && (
              <Stack>
                <Card sx={{ mb: 2 }} variant='outlined'>
                  <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
                    <PanToolIcon color='warning' />
                    <Typography variant='body2'>
                      Appealed by {evaluation.appealedBy ? membersRecord[evaluation.appealedBy]?.username : 'member'}{' '}
                      {getRelativeTimeInThePast(new Date(evaluation.appealedAt!.toString()))}
                    </Typography>
                  </Stack>
                </Card>
                {evaluation.appealReason && (
                  <Box mb={2}>
                    <FormLabel>
                      <Typography sx={{ mb: 0.5 }} variant='subtitle1'>
                        Appeal reason
                      </Typography>
                    </FormLabel>
                    <Typography>{evaluation.appealReason}</Typography>
                  </Box>
                )}
                <PassFailEvaluation
                  {...passFailProps}
                  isAppealProcess
                  onResetEvaluationReview={onResetEvaluationAppealReview}
                  isReviewer={evaluation.isAppealReviewer}
                  onSubmitEvaluationReview={onSubmitEvaluationAppealReview}
                  isSubmittingReview={isSubmittingEvaluationAppealReview}
                  isResettingEvaluationReview={isResettingEvaluationAppealReview}
                  completedAt={evaluation.result !== null ? evaluation.completedAt : undefined}
                  evaluationResult={evaluation.result}
                  evaluationReviews={evaluation.appealReviews}
                  requiredReviews={evaluation.appealRequiredReviews ?? 1}
                />
              </Stack>
            )}
          </Stack>
        )}
      </MultiTabs>
    );
  }

  return (
    <>
      <PassFailEvaluation {...passFailProps} />
      {canAppeal ? (
        <>
          <Stack width='100%' direction='row' justifyContent='flex-end'>
            <Button
              sx={{
                width: 'fit-content',
                my: 2
              }}
              data-test='evaluation-appeal-button'
              onClick={appealReasonPopupState.open}
              loading={isAppealingProposalEvaluation}
            >
              Appeal
            </Button>
          </Stack>
          <Modal open={appealReasonPopupState.isOpen} onClose={closeAppealReasonPopup} title='Reason for Appeal'>
            <Stack gap={1}>
              <TextField
                fullWidth
                data-test='appeal-reason-input'
                placeholder='Enter your reason for appealing'
                required
                value={appealReason ?? ''}
                onChange={(e) => setAppealReason(e.target.value)}
              />
              <Button
                sx={{
                  width: 'fit-content'
                }}
                data-test='appeal-reason-submit-button'
                disabled={!appealReason}
                onClick={onAppealProposalEvaluation}
              >
                Submit
              </Button>
            </Stack>
          </Modal>
        </>
      ) : null}
    </>
  );
}
