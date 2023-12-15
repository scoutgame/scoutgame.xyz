import { Alert, SvgIcon } from '@mui/material';
import { useMemo, useState } from 'react';
import { RiChatCheckLine } from 'react-icons/ri';

import { NoCommentsMessage } from 'components/[pageId]/DocumentPage/components/Sidebar/components/CommentsSidebar';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from 'lib/proposal/interface';

import { RubricDecision } from './RubricDecision';
import { RubricResults } from './RubricResults';
import { RubricAnswersForm } from './RubricReviewForm';

export type Props = {
  pageId?: string;
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'evaluations' | 'permissions' | 'status' | 'evaluationType'>;
  evaluation: PopulatedEvaluation;
  isCurrent?: boolean;
  refreshProposal?: VoidFunction;
};

export function RubricSidebar({ pageId, proposal, isCurrent, evaluation, refreshProposal }: Props) {
  const [rubricView, setRubricView] = useState<number>(0);
  const isAdmin = useIsAdmin();
  const { user } = useUser();
  const proposalPermissions = proposal?.permissions;
  const canAnswerRubric = proposalPermissions?.evaluate;
  const rubricCriteria = evaluation?.rubricCriteria;

  const myRubricAnswers = useMemo(
    () => evaluation?.rubricAnswers.filter((answer) => answer.userId === user?.id) || [],
    [user?.id, evaluation?.rubricAnswers]
  );
  const myDraftRubricAnswers = useMemo(
    () => evaluation?.draftRubricAnswers.filter((answer) => answer.userId === user?.id),
    [user?.id, evaluation?.draftRubricAnswers]
  );

  const canViewRubricAnswers = isAdmin || canAnswerRubric;

  async function onSubmitEvaluation({ isDraft }: { isDraft: boolean }) {
    if (!isDraft) {
      await refreshProposal?.();
      // Set view to "Results tab", assuming Results is the 2nd tab, ie value: 1
      setRubricView(1);
    }
  }
  /**
   *
   *  Tab visibility rules:
   *  Evaluate: visible when evaluation is active or closed, and only if you are a reviewer
   *  Results: visible to anyone when evaluation is active or closed, disabled if you are not a reviewer
   *
   * */
  const evaluationTabs = canViewRubricAnswers ? ['Your evaluation', 'Results', 'Decision'] : ['Your evaluation'];

  return (
    <>
      {evaluationTabs.length > 0 && (
        <>
          <Alert severity='info'>
            {canAnswerRubric
              ? 'Evaluation results are only visible to Reviewers'
              : 'Only Reviewers can submit an evaluation'}
          </Alert>

          <MultiTabs activeTab={rubricView} setActiveTab={setRubricView} tabs={evaluationTabs}>
            {({ value }) => (
              <>
                {value === 'Your evaluation' && (
                  <RubricAnswersForm
                    key='evaluate'
                    proposalId={proposal?.id || ''}
                    answers={myRubricAnswers}
                    draftAnswers={myDraftRubricAnswers}
                    criteriaList={rubricCriteria!}
                    onSubmit={onSubmitEvaluation}
                    disabled={!canAnswerRubric}
                  />
                )}
                {value === 'Results' && (
                  <RubricResults
                    key='results'
                    answers={evaluation?.rubricAnswers ?? []}
                    criteriaList={rubricCriteria || []}
                  />
                )}
                {value === 'Decision' && (
                  <RubricDecision
                    isCurrent={!!isCurrent}
                    key='results'
                    evaluation={evaluation}
                    proposal={proposal}
                    refreshProposal={refreshProposal}
                  />
                )}
              </>
            )}
          </MultiTabs>
        </>
      )}
      {evaluationTabs.length === 0 && !proposal && <LoadingComponent isLoading={true} />}
      {evaluationTabs.length === 0 && proposal && (
        <NoCommentsMessage
          icon={
            <SvgIcon
              component={RiChatCheckLine}
              color='secondary'
              fontSize='large'
              sx={{ mb: '1px', height: '2em', width: '2em' }}
            />
          }
          message='Evaluation is not enabled for this proposal'
        />
      )}
    </>
  );
}
