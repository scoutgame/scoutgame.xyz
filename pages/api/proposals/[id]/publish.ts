import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { FieldAnswerInput, FormFieldInput } from 'lib/forms/interfaces';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { getProposalErrors } from 'lib/proposals/getProposalErrors';
import type { ProposalFields } from 'lib/proposals/interfaces';
import { publishProposal } from 'lib/proposals/publishProposal';
import { validateProposalProject } from 'lib/proposals/validateProposalProject';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(publishProposalStatusController);

async function publishProposalStatusController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.move) {
    throw new ActionNotPermittedError(`You do not have permission to publish this proposal`);
  }

  const proposalPage = await prisma.page.findUniqueOrThrow({
    where: {
      proposalId
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      proposal: {
        include: {
          authors: true,
          formAnswers: true,
          evaluations: {
            include: {
              reviewers: true,
              rubricCriteria: true
            },
            orderBy: {
              index: 'asc'
            }
          },
          form: {
            include: {
              formFields: {
                orderBy: {
                  index: 'asc'
                }
              }
            }
          }
        }
      },
      spaceId: true
    }
  });
  const { isAdmin } = await hasAccessToSpace({
    spaceId: proposalPage.spaceId,
    userId,
    adminOnly: false
  });

  const isProposalArchived = proposalPage.proposal?.archived || false;
  if (isProposalArchived) {
    throw new ActionNotPermittedError(`You cannot publish an archived proposal`);
  }

  const errors = getProposalErrors({
    page: {
      title: proposalPage.title ?? '',
      type: proposalPage.type,
      content: proposalPage.content
    },
    contentType: proposalPage.proposal?.formId ? 'structured' : 'free_form',
    proposal: {
      ...proposalPage.proposal!,
      evaluations: proposalPage.proposal!.evaluations.map((e) => ({
        ...e,
        actionLabels: e.actionLabels as WorkflowEvaluationJson['actionLabels'],
        voteSettings: e.voteSettings as any,
        rubricCriteria: e.rubricCriteria as any[]
      })),
      fields: proposalPage.proposal!.fields as ProposalFields,
      authors: proposalPage.proposal!.authors.map((a) => a.userId),
      formAnswers: proposalPage.proposal!.formAnswers as unknown as FieldAnswerInput[],
      formFields: proposalPage.proposal!.form?.formFields as unknown as FormFieldInput[]
    },
    isDraft: false,
    requireTemplates: false
  });

  if (errors.length > 0 && !isAdmin) {
    throw new InvalidInputError(errors.join('\n'));
  }

  const currentEvaluationId = proposalPage?.proposal?.evaluations[0]?.id || null;

  const proposalForm = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    select: {
      projectId: true,
      formAnswers: {
        select: {
          fieldId: true,
          value: true
        }
      },
      form: {
        select: {
          formFields: {
            select: {
              fieldConfig: true,
              id: true,
              type: true
            }
          }
        }
      }
    }
  });

  if (proposalForm?.projectId) {
    await validateProposalProject({
      formAnswers: proposalForm?.formAnswers,
      projectId: proposalForm.projectId,
      formFields: proposalForm?.form?.formFields
    });
  }

  await publishProposal({
    proposalId,
    userId
  });

  if (proposalPage && currentEvaluationId) {
    await publishProposalEvent({
      proposalId,
      spaceId: proposalPage.spaceId,
      userId,
      currentEvaluationId
    });
  }

  trackUserAction('new_proposal_stage', {
    userId,
    pageId: proposalPage?.id || '',
    resourceId: proposalId,
    status: 'published',
    spaceId: proposalPage?.spaceId || ''
  });

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
