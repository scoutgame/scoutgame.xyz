import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { useEffect, useState } from 'react';

import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { evaluationTypesWithSidebar, ProposalSidebarHeader } from './components/ProposalSidebarHeader';
import { RubricSidebar } from './components/RubricSidebar';
import { VoteSidebar } from './components/VoteSidebar';

export type Props = {
  pageId?: string;
  isTemplate?: boolean;
  proposal?: Pick<
    ProposalWithUsersAndRubric,
    'id' | 'authors' | 'evaluations' | 'permissions' | 'status' | 'evaluationType'
  >;
  evaluationId?: string | null;
  refreshProposal?: VoidFunction;
  goToSettings: VoidFunction;
};

export function EvaluationSidebar({
  pageId,
  isTemplate,
  proposal,
  evaluationId: evaluationIdFromContext = null,
  refreshProposal,
  goToSettings
}: Props) {
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | null>(evaluationIdFromContext);
  const currentEvaluation = getCurrentEvaluation(proposal?.evaluations || []);

  const evaluation = proposal?.evaluations.find((e) => e.id === activeEvaluationId);

  useEffect(() => {
    setActiveEvaluationId(evaluationIdFromContext);
  }, [evaluationIdFromContext]);

  useEffect(() => {
    if (evaluationIdFromContext) {
      return;
    }
    // if we were not provided a specific evaluation, go to the default view
    if (isTemplate) {
      goToSettings();
    }
    // check for activeEvaluationId in case the user has navigated between steps (and evaluationIdFromContext was not updated)
    else if (proposal && !activeEvaluationId) {
      const sidebarEvaluations = proposal.evaluations.filter((e) => evaluationTypesWithSidebar.includes(e.type));
      // open current evaluation by default
      if (currentEvaluation && sidebarEvaluations.some((e) => e.id === currentEvaluation.id)) {
        setActiveEvaluationId(currentEvaluation.id);
      }
      // go to the first evaluation
      else if (sidebarEvaluations.length > 0) {
        setActiveEvaluationId(sidebarEvaluations[0].id);
      }
      // in this case, there are no evaluations that appear in the sidebar, so go to settings
      else {
        goToSettings();
      }
    }
  }, [!!proposal, !!evaluationIdFromContext, !!activeEvaluationId]);

  const isCurrent = currentEvaluation?.id === evaluation?.id;

  return (
    <>
      <ProposalSidebarHeader
        activeEvaluationId={activeEvaluationId}
        evaluations={proposal?.evaluations || []}
        goToEvaluation={setActiveEvaluationId}
        goToSettings={goToSettings}
      />

      {evaluation?.type === 'rubric' && (
        <RubricSidebar {...{ pageId, proposal, isCurrent, evaluation, refreshProposal }} />
      )}
      {evaluation?.type === 'vote' && <VoteSidebar {...{ proposal, isCurrent, evaluation, refreshProposal }} />}
    </>
  );
}
