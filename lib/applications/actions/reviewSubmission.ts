import { Application, ApplicationStatus } from '@prisma/client';
import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError, WrongStateError } from 'lib/utilities/errors';
import { getApplication } from '../getApplication';
import { ReviewDecision, SubmissionReview } from '../interfaces';

const submissionStatusAfterDecision: Record<ReviewDecision, ApplicationStatus> = {
  approve: 'complete',
  reject: 'rejected',
  pay: 'paid'
};

/**
 * Accept, reject or request changes for the work
 * @returns
 */
export async function reviewSubmission ({ submissionId, decision }: SubmissionReview): Promise<Application> {
  const submission = await getApplication(submissionId);

  if (!submission) {
    throw new DataNotFoundError(`Application with id ${submissionId} was not found`);
  }

  if (submission.status !== 'review' && decision === 'approve') {
    throw new WrongStateError('Submissions must be in review for you to approve them');
  }

  if (submission.status !== 'complete' && decision === 'pay') {
    throw new WrongStateError('Submissions must be completed for you to make payment');
  }

  const correspondingSubmissionStatus = submissionStatusAfterDecision[decision];

  if (!correspondingSubmissionStatus) {
    throw new InvalidInputError(`Decision ${decision} is invalid`);
  }

  const updated = await prisma.application.update({
    where: {
      id: submission.id
    },
    data: {
      status: correspondingSubmissionStatus
    }
  }) as Application;

  return updated;
}
