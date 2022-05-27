
import { Bounty, PageOperations, PagePermissionLevel, Space, User } from '@prisma/client';
import { computeUserPagePermissions, permissionTemplates, upsertPermission } from 'lib/permissions/pages';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { ExpectedAnError } from 'testing/errors';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors/errors';
import { createBounty } from '../createBounty';
import { PositiveNumbersOnlyError } from '../../utilities/errors/numbers';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('createBounty', () => {

  it('should be able to create a bounty suggestion with only a title, createdBy, spaceId and status, and record who suggested the bounty', async () => {

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: user.id,
      spaceId: space.id
    });

    expect(bounty).toEqual(
      expect.objectContaining<Partial<Bounty>>({
        title: expect.stringContaining('My bounty'),
        description: expect.any(String),
        createdBy: expect.stringContaining(user.id),
        spaceId: expect.stringContaining(space.id),
        suggestedBy: expect.stringContaining(user.id)
      })
    );

  });

  it('should be able to create a bounty in open status if the data provided has at least title, createdBy, spaceId, status and rewardAmount', async () => {

    const { user: adminUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: adminUser.id,
      spaceId: localSpace.id,
      status: 'open',
      rewardAmount: 1
    });

    expect(bounty).toEqual(
      expect.objectContaining<Partial<Bounty>>({
        title: expect.stringContaining('My bounty'),
        description: expect.any(String),
        createdBy: expect.stringContaining(adminUser.id),
        spaceId: expect.stringContaining(localSpace.id)
      })
    );

  });

  it('should fail to create an open bounty if the reward amount is 0 and status is open', async () => {

    const { user: localUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    try {

      await createBounty({
        title: 'My bounty',
        createdBy: localUser.id,
        spaceId: localSpace.id,
        rewardAmount: 0,
        status: 'open'
      });

      throw new ExpectedAnError();

    }
    catch (error) {
      expect(error).toBeInstanceOf(InvalidInputError);
    }

  });

  it('should fail to create a bounty if the reward amount is negative', async () => {

    const { user: localUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    try {

      await createBounty({
        title: 'My bounty',
        createdBy: localUser.id,
        spaceId: localSpace.id,
        rewardAmount: -10,
        status: 'open'
      });

      throw new ExpectedAnError();

    }
    catch (error) {
      expect(error).toBeInstanceOf(PositiveNumbersOnlyError);
    }

  });

});

