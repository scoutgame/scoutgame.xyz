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

describe('PUT /api/proposals/evaluations/[id]/appeal/submit-result - Submit appeal review result', () => {
  it('should fail if the evaluation is not appealable and respond with 401', async () => {
    await prisma.proposalEvaluation.update({
      where: { id: evaluationId },
      data: { appealable: false }
    });
    const userCookie = await loginUser(admin.id);
    const response = await request(baseUrl)
      .put(`/api/proposals/evaluations/${evaluationId}/appeal/submit-result`)
      .set('Cookie', userCookie)
      .send({ result: 'pass' });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('This evaluation is not appealable.');

    await prisma.proposalEvaluation.update({
      where: { id: evaluationId },
      data: { appealable: true }
    });
  });

  it('should fail if the evaluation has not been appealed and respond with 401', async () => {
    const userCookie = await loginUser(admin.id);
    const response = await request(baseUrl)
      .put(`/api/proposals/evaluations/${evaluationId}/appeal/submit-result`)
      .set('Cookie', userCookie)
      .send({ result: 'pass' });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Appeal has not been requested for this evaluation.');

    await prisma.proposalEvaluation.update({
      where: { id: evaluationId },
      data: { appealedAt: new Date() }
    });
  });

  it('should throw error if the appeal evaluations is equal to the required reviews', async () => {
    await prisma.proposalEvaluationAppealReview.create({
      data: {
        evaluationId,
        reviewerId: admin.id,
        result: 'pass'
      }
    });

    const userCookie = await loginUser(admin.id);
    const response = await request(baseUrl)
      .put(`/api/proposals/evaluations/${evaluationId}/appeal/submit-result`)
      .set('Cookie', userCookie)
      .send({ result: 'pass' });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('This evaluation appeal has already been reviewed.');

    await prisma.proposalEvaluationAppealReview.deleteMany({
      where: {
        evaluationId,
        reviewerId: admin.id
      }
    });
  });

  it('should throw error if the evaluation has already been reviewed', async () => {
    await prisma.proposalEvaluation.update({
      where: { id: evaluationId },
      data: { result: 'pass' }
    });

    const userCookie = await loginUser(admin.id);
    const response = await request(baseUrl)
      .put(`/api/proposals/evaluations/${evaluationId}/appeal/submit-result`)
      .set('Cookie', userCookie)
      .send({ result: 'pass' });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('This evaluation has already been reviewed.');

    await prisma.proposalEvaluation.update({
      where: { id: evaluationId },
      data: { result: null }
    });
  });

  it('should throw error if the user is not allowed to review the appeal', async () => {
    const userCookie = await loginUser(spaceMember.id);
    const response = await request(baseUrl)
      .put(`/api/proposals/evaluations/${evaluationId}/appeal/submit-result`)
      .set('Cookie', userCookie)
      .send({ result: 'pass' });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("You don't have permission to review this appeal.");
  });

  it('should throw error if the user has already reviewed the appeal', async () => {
    await prisma.proposalEvaluation.update({
      where: {
        id: evaluationId
      },
      data: {
        appealRequiredReviews: 2
      }
    });

    await prisma.proposalEvaluationAppealReview.create({
      data: {
        evaluationId,
        reviewerId: admin.id,
        result: 'pass'
      }
    });

    const userCookie = await loginUser(admin.id);
    const response = await request(baseUrl)
      .put(`/api/proposals/evaluations/${evaluationId}/appeal/submit-result`)
      .set('Cookie', userCookie)
      .send({ result: 'pass' });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('You have already reviewed this appeal.');

    await prisma.proposalEvaluationAppealReview.deleteMany({
      where: {
        evaluationId,
        reviewerId: admin.id
      }
    });

    await prisma.proposalEvaluation.update({
      where: {
        id: evaluationId
      },
      data: {
        appealRequiredReviews: 1
      }
    });
  });

  it('should successfully submit the appeal review result and respond with 200', async () => {
    const userCookie = await loginUser(admin.id);
    const response = await request(baseUrl)
      .put(`/api/proposals/evaluations/${evaluationId}/appeal/submit-result`)
      .set('Cookie', userCookie)
      .send({ result: 'pass' });
    expect(response.statusCode).toBe(200);

    const evaluation = await prisma.proposalEvaluation.findFirstOrThrow({
      where: {
        id: evaluationId
      }
    });

    expect(evaluation.result).toBe('pass');
  });
});
