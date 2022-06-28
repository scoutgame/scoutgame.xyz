
import { Space, User } from '@prisma/client';
import { createBounty, updateBountySettings } from 'lib/bounties';
import { LimitReachedError, UnauthorisedActionError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { approveApplication } from '../approveApplication';
import { createApplication } from '../createApplication';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('approveApplication', () => {

  it('should approve an application if the bounty submissions cap has not been reached', async () => {

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: user.id,
      spaceId: space.id,
      reviewer: user.id,
      maxSubmissions: 20
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: user.id
    });

    const approved = await approveApplication({
      userId: user.id,
      applicationOrApplicationId: application
    });

    expect(approved.status).toBe('inProgress');

  });

  it('should fail to approve the application if the limit of active submissions has been reached', async () => {

    const { user: adminUser, space: adminSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: adminUser.id,
      spaceId: adminSpace.id,
      // Random person
      reviewer: null
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: adminUser.id
    });

    await updateBountySettings({
      bountyId: bounty.id,
      updateContent: {
        maxSubmissions: 0
      }
    });

    try {
      await approveApplication({
        userId: adminUser.id,
        applicationOrApplicationId: application
      });
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(LimitReachedError);
    }

  });

});

