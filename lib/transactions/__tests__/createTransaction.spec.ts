import { Application, Bounty, Space, User } from '@prisma/client';
import { createSubmission } from 'lib/applications/actions';
import { createTransaction } from 'lib/transactions/createTransaction';
import { generateBounty, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';

let user: User;
let space: Space;
let bounty: Bounty;
let application: Application;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
  bounty = await generateBounty({
    createdBy: user.id,
    spaceId: space.id,
    status: 'open',
    approveSubmitters: false
  });
  application = await createSubmission({
    bountyId: bounty.id,
    userId: user.id,
    submissionContent: {
      submission: 'Hello World',
      submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission"}]}]}'
    }
  });
});

describe('listSubmissions', () => {
  it('Should create transaction for a submission', async () => {
    const transaction = await createTransaction({
      applicationId: application.id,
      chainId: '4',
      transactionId: '123'
    });

    expect(transaction).not.toBeNull();
  });

  it('Should throw error if application doesn\'t exist', async () => {
    const applicationId = v4();
    try {
      await createTransaction({
        applicationId,
        chainId: '4',
        transactionId: '123'
      });
    }
    catch (err: any) {
      expect(err.message).toBe(`Application with id ${applicationId} not found`);
    }
  });
});
