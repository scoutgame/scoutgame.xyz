import type { Proposal, ProposalEvaluation, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';
import { v4 as uuid, v4 } from 'uuid';

import { createProposal } from 'lib/proposals/createProposal';
import { emptyDocument } from 'lib/prosemirror/constants';
import { baseUrl, loginUser } from 'testing/mockApiCall';

let space: Space;
let proposalCreator: User;
let spaceMember: User;
let admin: User;
let workflow: ProposalWorkflowTyped;
let proposal: Proposal & {
  evaluations: ProposalEvaluation[];
};
let evaluationId: string;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
  space = generated.space;
  proposalCreator = generated.user;
  spaceMember = await testUtilsUser.generateSpaceUser({
    spaceId: space.id
  });
  admin = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: true
  });

  workflow = (await prisma.proposalWorkflow.create({
    data: {
      index: 0,
      title: 'Default flow',
      spaceId: space.id,
      evaluations: [
        {
          id: uuid(),
          title: 'Pass/fail',
          permissions: [
            { systemRole: 'all_reviewers', operation: 'comment' },
            { operation: 'view', systemRole: 'space_member' }
          ],
          reviewers: [{ group: 'user', id: admin.id }],
          appealable: true,
          appealRequiredReviews: 1,
          appealReviewers: [
            {
              userId: admin.id
            }
          ],
          type: 'pass_fail'
        }
      ]
    }
  })) as ProposalWorkflowTyped;

  const result = await createProposal({
    evaluations: [
      {
        type: 'pass_fail',
        reviewers: [{ userId: admin.id }],
        title: 'Pass/fail',
        index: 0,
        rubricCriteria: [],
        id: v4()
      }
    ],
    authors: [proposalCreator.id],
    pageProps: {
      autoGenerated: false,
      content: { ...emptyDocument },
      contentText: 'Empty proposal',
      title: 'Proposal title'
    },
    spaceId: space.id,
    userId: proposalCreator.id,
    workflowId: workflow.id
  });

  proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: result.proposal.id
    },
    include: {
      evaluations: true
    }
  });

  evaluationId = proposal.evaluations[0].id;
});

describe('POST /api/proposals/evaluations/[id]/appeal/reset-review - Reset review for an evaluation step appeal', () => {
  it('should fail to reset review if the user is not allowed to review the appeal and respond with 401', async () => {
    const userCookie = await loginUser(spaceMember.id);
    const response = await request(baseUrl)
      .put(`/api/proposals/evaluations/${evaluationId}/appeal/reset-review`)
      .set('Cookie', userCookie);
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("You don't have permission to review this appeal.");
  });

  it('should fail to reset review if the evaluation has not been appealed and respond with 401', async () => {
    const userCookie = await loginUser(admin.id);
    const response = await request(baseUrl)
      .put(`/api/proposals/evaluations/${evaluationId}/appeal/reset-review`)
      .set('Cookie', userCookie);
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('You cannot reset a review that has not been appealed.');
  });

  it('should fail to reset review if the evaluation has already been completed and respond with 401', async () => {
    await prisma.proposalEvaluation.update({
      where: { id: evaluationId },
      data: { result: 'fail', appealedAt: new Date() }
    });
    const userCookie = await loginUser(admin.id);
    const response = await request(baseUrl)
      .put(`/api/proposals/evaluations/${evaluationId}/appeal/reset-review`)
      .set('Cookie', userCookie);
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('You cannot reset a review that has been completed.');

    await prisma.proposalEvaluation.update({
      where: { id: evaluationId },
      data: { result: null }
    });
  });

  it('should successfully reset the review and respond with 200', async () => {
    await prisma.proposalEvaluation.update({
      where: { id: evaluationId },
      data: { appealedAt: new Date() }
    });
    const userCookie = await loginUser(admin.id);
    const response = await request(baseUrl)
      .put(`/api/proposals/evaluations/${evaluationId}/appeal/reset-review`)
      .set('Cookie', userCookie);
    expect(response.statusCode).toBe(200);

    const review = await prisma.proposalEvaluationAppealReview.findFirst({
      where: {
        evaluationId,
        reviewerId: admin.id
      }
    });

    expect(review).toBeNull();
  });
});
