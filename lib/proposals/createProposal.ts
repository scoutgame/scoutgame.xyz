import { InvalidInputError } from '@charmverse/core/errors';
import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Page, ProposalReviewer, ProposalStatus } from '@charmverse/core/prisma';
import type {
  Prisma,
  ProposalAppealReviewer,
  ProposalEvaluation,
  ProposalEvaluationApprover
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped, WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { arrayUtils } from '@charmverse/core/utilities';
import { rewardCharmsForProposal } from '@root/lib/charms/triggers/rewardCharmsForProposal';
import { createForm } from '@root/lib/forms/createForm';
import type { FieldAnswerInput, FormFieldInput } from '@root/lib/forms/interfaces';
import { upsertProposalFormAnswers } from '@root/lib/forms/upsertProposalFormAnswers';
import { trackUserAction } from '@root/lib/metrics/mixpanel/trackUserAction';
import { createPage } from '@root/lib/pages/server/createPage';
import { getProjectById } from '@root/lib/projects/getProjectById';
import type { ProposalFields } from '@root/lib/proposals/interfaces';
import { v4 as uuid } from 'uuid';

import { generatePagePathFromPathAndTitle } from '../pages/utils';

import { createVoteIfNecessary } from './createVoteIfNecessary';
import { getProposalErrors } from './getProposalErrors';
import { getVoteEvaluationStepsWithBlockNumber } from './getVoteEvaluationStepsWithBlockNumber';
import type { VoteSettings } from './interfaces';
import type { RubricDataInput } from './rubric/upsertRubricCriteria';
import { upsertRubricCriteria } from './rubric/upsertRubricCriteria';

type PageProps = Partial<
  Pick<
    Page,
    'title' | 'content' | 'contentText' | 'sourceTemplateId' | 'type' | 'autoGenerated' | 'path' | 'hasContent'
  >
>;

export type ProposalEvaluationInput = Pick<ProposalEvaluation, 'id' | 'index' | 'title' | 'type'> & {
  finalStep?: boolean | null;
  reviewers: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
  evaluationApprovers?: Partial<Pick<ProposalEvaluationApprover, 'userId' | 'roleId'>>[] | null;
  rubricCriteria: RubricDataInput[];
  voteSettings?: VoteSettings | null;
  requiredReviews?: WorkflowEvaluationJson['requiredReviews'];
  notificationLabels?: WorkflowEvaluationJson['notificationLabels'];
  actionLabels?: WorkflowEvaluationJson['actionLabels'];
  appealable?: boolean | null;
  appealRequiredReviews?: WorkflowEvaluationJson['appealRequiredReviews'] | null;
  appealReviewers?: Partial<Pick<ProposalAppealReviewer, 'userId' | 'roleId'>>[] | null;
};

export type CreateProposalInput = {
  pageId?: string;
  pageProps: PageProps;
  // proposalTemplateId?: string | null;
  authors: string[];
  userId: string;
  spaceId: string;
  evaluations: ProposalEvaluationInput[];
  fields?: ProposalFields | null;
  workflowId: string;
  formFields?: FormFieldInput[];
  formAnswers?: FieldAnswerInput[];
  formId?: string;
  isDraft?: boolean;
  selectedCredentialTemplates?: string[];
  sourcePageId?: string;
  sourcePostId?: string;
  projectId?: string;
};
export async function createProposal({
  userId,
  spaceId,
  pageProps,
  authors,
  evaluations = [],
  fields,
  workflowId,
  formId,
  formFields,
  formAnswers,
  isDraft,
  selectedCredentialTemplates,
  sourcePageId,
  sourcePostId,
  projectId
}: CreateProposalInput) {
  const proposalId = uuid();
  const proposalStatus: ProposalStatus = isDraft ? 'draft' : 'published';

  const defaultAuthorsList = pageProps?.type !== 'proposal_template' ? [userId] : [];
  const authorsList = arrayUtils.uniqueValues([...(authors || []), ...defaultAuthorsList]);

  const evaluationIds = evaluations.map(() => uuid());

  const evaluationPermissionsToCreate: Prisma.ProposalEvaluationPermissionCreateManyInput[] = [];

  const reviewersInput: Prisma.ProposalReviewerCreateManyInput[] = [];
  const appealReviewersInput: Prisma.ProposalAppealReviewerCreateManyInput[] = [];
  const approversInput: Prisma.ProposalEvaluationApproverCreateManyInput[] = [];

  const project = projectId ? await getProjectById(projectId) : null;

  const errors = getProposalErrors({
    page: {
      title: pageProps.title ?? '',
      type: pageProps.type,
      hasContent: pageProps.hasContent
    },
    contentType: formId || formFields?.length ? 'structured' : 'free_form',
    proposal: {
      authors: authorsList,
      formAnswers,
      formFields,
      evaluations,
      workflowId
    },
    isDraft: !!isDraft,
    project,
    requireTemplates: false
  });

  const workflow = (await prisma.proposalWorkflow.findUniqueOrThrow({
    where: {
      id: workflowId
    }
  })) as ProposalWorkflowTyped;

  if (errors.length > 0) {
    throw new InvalidInputError(errors.join('\n'));
  }

  // retrieve permissions and apply evaluation ids to reviewers
  evaluations.forEach(({ id: evaluationId, reviewers: evalReviewers, appealReviewers, evaluationApprovers }, index) => {
    const permissions = workflow.evaluations[index]?.permissions;
    if (!permissions) {
      throw new Error(
        `Cannot find permissions for evaluation step. Workflow: ${workflowId}. Evaluation: ${evaluationId}`
      );
    }
    evaluationPermissionsToCreate.push(
      ...permissions.map((permission) => ({
        ...permission,
        evaluationId: evaluationIds[index]
      }))
    );
    reviewersInput.push(
      ...evalReviewers.map((reviewer) => ({
        roleId: reviewer.roleId,
        systemRole: reviewer.systemRole,
        userId: reviewer.userId,
        proposalId,
        evaluationId: evaluationIds[index]
      }))
    );
    if (appealReviewers) {
      appealReviewersInput.push(
        ...appealReviewers.map((reviewer) => ({
          roleId: reviewer.roleId,
          userId: reviewer.userId,
          proposalId,
          evaluationId: evaluationIds[index]
        }))
      );
    }
    if (evaluationApprovers) {
      approversInput.push(
        ...evaluationApprovers.map((approver) => ({
          roleId: approver.roleId,
          userId: approver.userId,
          proposalId,
          evaluationId: evaluationIds[index]
        }))
      );
    }
  });

  let proposalFormId = formId;
  // Always create new form for proposal templates
  if (formFields?.length && pageProps.type === 'proposal_template') {
    proposalFormId = await createForm(formFields);
  }

  const evaluationsWithBlockNumber = await getVoteEvaluationStepsWithBlockNumber({
    evaluations: evaluations.map((evaluation, index) => ({ ...evaluation, id: evaluationIds[index] })),
    isDraft: !!isDraft,
    pageType: pageProps.type
  });

  // Using a transaction to ensure both the proposal and page gets created together
  const [proposal, _reviewerCreation, _appealReviewer, _evaluationPermissions, page] = await prisma.$transaction([
    prisma.proposal.create({
      data: {
        // Add page creator as the proposal's first author
        createdBy: userId,
        id: proposalId,
        space: { connect: { id: spaceId } },
        status: proposalStatus,
        selectedCredentialTemplates,
        authors: {
          createMany: {
            data: authorsList.map((author) => ({ userId: author }))
          }
        },
        evaluations: {
          createMany: {
            data: evaluationsWithBlockNumber.map((evaluation, index) => ({
              id: evaluationIds[index],
              voteSettings: evaluation.voteSettings || undefined,
              index: evaluation.index,
              title: evaluation.title,
              type: evaluation.type,
              actionLabels: (evaluation.actionLabels ?? null) as Prisma.InputJsonValue,
              notificationLabels: (evaluation.notificationLabels ?? null) as Prisma.InputJsonValue,
              requiredReviews: evaluation.requiredReviews ?? 1,
              finalStep: evaluation.finalStep,
              appealable: evaluation.appealable,
              appealRequiredReviews: evaluation.appealRequiredReviews
            }))
          }
        },
        fields: fields as any,
        workflow: workflowId
          ? {
              connect: {
                id: workflowId
              }
            }
          : undefined,
        form: proposalFormId ? { connect: { id: proposalFormId } } : undefined,
        project: {
          connect: projectId ? { id: projectId } : undefined
        }
      },
      include: {
        authors: true
      }
    }),
    prisma.proposalReviewer.createMany({
      data: reviewersInput
    }),
    prisma.proposalAppealReviewer.createMany({
      data: appealReviewersInput
    }),
    prisma.proposalEvaluationPermission.createMany({
      data: pageProps?.type === 'proposal_template' ? [] : evaluationPermissionsToCreate
    }),
    createPage({
      data: {
        autoGenerated: pageProps?.autoGenerated ?? false,
        content: pageProps?.content ?? undefined,
        createdBy: userId,
        contentText: pageProps?.contentText ?? '',
        id: proposalId,
        path: pageProps?.path || generatePagePathFromPathAndTitle({ title: pageProps?.title ?? '' }),
        proposalId,
        sourceTemplateId: pageProps?.sourceTemplateId,
        title: pageProps?.title ?? '',
        type: pageProps?.type ?? 'proposal',
        updatedBy: userId,
        spaceId
      }
    })
  ]);

  const createdReviewers = await prisma.proposalReviewer.findMany({
    where: { proposalId: proposal.id }
  });

  trackUserAction('new_proposal_created', { userId, pageId: page.id, resourceId: proposal.id, spaceId });

  await Promise.all(
    evaluations.map(async (evaluation, index) => {
      if (evaluation.rubricCriteria?.length > 0) {
        await upsertRubricCriteria({
          evaluationId: evaluationIds[index],
          proposalId: proposal.id,
          rubricCriteria: evaluation.rubricCriteria,
          actorId: userId
        });
      }
    })
  );

  const proposalFormFields = proposal.formId
    ? await prisma.formField.findMany({ where: { formId: proposal.formId } })
    : null;

  const proposalFormAnswers =
    formId && formAnswers?.length && page.type === 'proposal'
      ? await upsertProposalFormAnswers({ proposalId, answers: formAnswers })
      : null;

  // make sure proposal is published before we create a vote
  if (!isDraft) {
    await createVoteIfNecessary({
      createdBy: userId,
      proposalId
    });
  }

  if (sourcePageId) {
    await prisma.page.update({
      where: {
        id: sourcePageId
      },
      data: {
        convertedProposalId: proposalId
      }
    });
  } else if (sourcePostId) {
    await prisma.post.update({
      where: {
        id: sourcePostId
      },
      data: {
        proposalId
      }
    });
  }

  if (proposalStatus === 'published') {
    rewardCharmsForProposal(userId);
  }

  return {
    page: page as PageWithPermissions,
    proposal: {
      ...proposal,
      reviewers: createdReviewers,
      draftRubricAnswers: [],
      rubricAnswers: [],
      formFields: proposalFormFields,
      formAnswers: proposalFormAnswers
    }
  };
}
