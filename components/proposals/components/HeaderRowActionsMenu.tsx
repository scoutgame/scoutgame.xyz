import type { ProposalEvaluationResult, ProposalSystemRole } from '@charmverse/core/prisma';
import { useMemo } from 'react';

import charmClient from 'charmClient';
import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import type { ViewHeaderRowsMenuProps } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderRowsMenu/viewHeaderRowsMenu';
import { ViewHeaderRowsMenu } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderRowsMenu/viewHeaderRowsMenu';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProposalEvaluationStep } from 'lib/proposal/interface';
import { isTruthy } from 'lib/utilities/types';

import { useBatchUpdateProposalStatusOrStep } from '../hooks/useBatchUpdateProposalStatusOrStep';
import { useProposals } from '../hooks/useProposals';

type Props = Pick<
  ViewHeaderRowsMenuProps,
  'checkedIds' | 'setCheckedIds' | 'cards' | 'board' | 'propertyTemplates' | 'onChange'
> & {
  refreshProposals: VoidFunction;
};

export function HeaderRowActionsMenu({
  board,
  cards,
  checkedIds,
  setCheckedIds,
  propertyTemplates,
  refreshProposals
}: Props) {
  const { showError } = useSnackbar();
  const { pages } = usePages();
  const { proposalsMap } = useProposals();
  const { updateStatuses, updateSteps } = useBatchUpdateProposalStatusOrStep();

  async function onProposalReviewerSelect(pageIds: string[], reviewers: SelectOption[]) {
    let proposalReviewersChanged = false;
    for (const pageId of pageIds) {
      const page = pages[pageId];
      const proposalId = page?.proposalId;
      const proposal = proposalId ? proposalsMap[proposalId] : null;
      const proposalWithEvaluationId = proposal?.currentEvaluationId;
      if (proposal && proposalWithEvaluationId && !proposal.archived) {
        await charmClient.proposals.updateProposalEvaluation({
          reviewers: reviewers.map((reviewer) => ({
            roleId: reviewer.group === 'role' ? reviewer.id : null,
            systemRole: reviewer.group === 'system_role' ? (reviewer.id as ProposalSystemRole) : null,
            userId: reviewer.group === 'user' ? reviewer.id : null
          })),
          proposalId: proposal.id,
          evaluationId: proposalWithEvaluationId
        });
        proposalReviewersChanged = true;
      }
    }
    if (proposalReviewersChanged) {
      try {
        await refreshProposals();
      } catch (error) {
        showError(error, 'There was an error updating reviewers');
      }
    }
  }

  async function onProposalStatusUpdate(pageIds: string[], result: ProposalEvaluationResult) {
    if (pageIds.length === 0) {
      return;
    }

    const firstProposal = proposalsMap[pages[pageIds[0]]?.proposalId ?? ''];

    if (!firstProposal) {
      return;
    }

    const proposalsData: {
      proposalId: string;
      evaluationId?: string;
    }[] = [];

    pageIds.forEach((pageId) => {
      const proposal = proposalsMap[pages[pageId]?.proposalId ?? ''];
      if (proposal?.currentStep.step === firstProposal.currentStep.step && !proposal.archived) {
        proposalsData.push({
          proposalId: proposal.id,
          evaluationId: proposal.currentEvaluationId
        });
      }
    });

    if (proposalsData.length) {
      try {
        await updateStatuses({
          proposalsData,
          result,
          currentEvaluationStep: firstProposal.currentStep.step
        });
      } catch (error) {
        showError(error, 'There was an error updating statuses');
      }
    }
  }

  async function onProposalStepUpdate(pageIds: string[], evaluationId: string, moveForward: boolean) {
    if (pageIds.length === 0) {
      return;
    }

    const firstProposal = proposalsMap[pages[pageIds[0]]?.proposalId ?? ''];

    if (!firstProposal) {
      return;
    }

    const evaluationIndex = firstProposal.evaluations.findIndex((evaluation) => evaluation.id === evaluationId);

    const proposalsData: {
      proposalId: string;
      evaluationId: string;
      currentEvaluationStep: ProposalEvaluationStep;
    }[] = [];

    pageIds.forEach((pageId) => {
      const proposal = proposalsMap[pages[pageId]?.proposalId ?? ''];
      if (proposal && !proposal.archived) {
        if (
          (evaluationId === 'rewards' &&
            ((proposal.fields?.pendingRewards ?? []).length > 0 || (proposal.rewardIds ?? [])?.length > 0)) ||
          evaluationId !== 'rewards'
        ) {
          proposalsData.push({
            proposalId: proposal.id,
            evaluationId: evaluationId === 'draft' ? evaluationId : proposal.evaluations[evaluationIndex].id,
            currentEvaluationStep: proposal.currentStep.step
          });
        }
      }
    });

    if (proposalsData.length) {
      try {
        await updateSteps(proposalsData, moveForward);
      } catch (error) {
        showError(error, 'There was an error updating steps');
      }
    }
  }

  async function onProposalAuthorSelect(pageIds: string[], authorIds: string[]) {
    for (const pageId of pageIds) {
      const proposalId = pages[pageId]?.proposalId;
      const proposal = proposalId ? proposalsMap[proposalId] : null;
      if (proposalId && !proposal?.archived) {
        try {
          await charmClient.proposals.updateProposal({
            authors: authorIds,
            proposalId
          });
        } catch (error) {
          showError(error, 'There was an error updating authors');
        }
      }
    }
  }

  const { isStepDisabled, isStatusDisabled, isReviewersDisabled } = useMemo(() => {
    const checkedPages = checkedIds.map((id) => pages[id]).filter(isTruthy);
    const firstProposal = proposalsMap[checkedPages[0]?.proposalId ?? ''];
    const _isReviewerDisabled = checkedPages.some((checkedPage) => {
      const proposal = proposalsMap[checkedPage.proposalId ?? ''];
      return (
        !proposal ||
        proposal.archived ||
        proposal.currentStep.step === 'draft' ||
        proposal.currentStep.step === 'feedback'
      );
    });

    const _isStatusDisabled =
      !firstProposal ||
      checkedPages.some((checkedPage) => {
        const proposal = proposalsMap[checkedPage.proposalId ?? ''];
        return !proposal || proposal.archived || proposal.currentStep.step !== firstProposal.currentStep.step;
      });

    const _isStepDisabled =
      !firstProposal ||
      checkedPages.some((checkedPage) => {
        const proposal = proposalsMap[checkedPage.proposalId ?? ''];
        return (
          !proposal ||
          proposal.archived ||
          proposal.evaluations.length !== firstProposal.evaluations.length ||
          // Check if all evaluations are in the same workflow
          proposal.evaluations.some((evaluation, index) => {
            const firstProposalEvaluation = firstProposal.evaluations[index];
            return (
              evaluation.type !== firstProposalEvaluation.type || evaluation.title !== firstProposalEvaluation.title
            );
          })
        );
      });

    return {
      isStepDisabled: _isStepDisabled,
      isStatusDisabled: _isStatusDisabled,
      isReviewersDisabled: _isReviewerDisabled
    };
  }, [pages, checkedIds, proposalsMap]);

  const firstCheckedProposal = useMemo(() => {
    let firstCheckedProposalId;
    for (const checkedId of checkedIds) {
      const proposalId = pages[checkedId]?.proposalId;
      if (proposalId) {
        firstCheckedProposalId = proposalId;
        break;
      }
    }
    return firstCheckedProposalId ? proposalsMap[firstCheckedProposalId] : undefined;
  }, [checkedIds, pages, proposalsMap]);

  return (
    <ViewHeaderRowsMenu
      board={board}
      cards={cards}
      checkedIds={checkedIds}
      setCheckedIds={setCheckedIds}
      propertyTemplates={propertyTemplates}
      onChange={() => {
        refreshProposals();
      }}
      firstCheckedProposal={firstCheckedProposal}
      isStepDisabled={isStepDisabled}
      isStatusDisabled={isStatusDisabled}
      isReviewersDisabled={isReviewersDisabled}
      onProposalAuthorSelect={onProposalAuthorSelect}
      onProposalReviewerSelect={onProposalReviewerSelect}
      onProposalStatusUpdate={onProposalStatusUpdate}
      onProposalStepUpdate={onProposalStepUpdate}
    />
  );
}
