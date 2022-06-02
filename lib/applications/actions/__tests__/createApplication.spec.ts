
import { Bounty, PageOperations, PagePermissionLevel, Space, User } from '@prisma/client';
import { computeUserPagePermissions, permissionTemplates, upsertPermission } from 'lib/permissions/pages';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { ExpectedAnError } from 'testing/errors';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { DataNotFoundError, InvalidInputError, UnauthorisedActionError, LimitReachedError, PositiveNumbersOnlyError, DuplicateDataError, StringTooShortError } from 'lib/utilities/errors';
import { createBounty } from 'lib/bounties/createBounty';
import { createApplication } from '../createApplication';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from '../../shared';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('createApplication', () => {

  it('should create an application in applied status', async () => {

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: user.id,
      spaceId: space.id
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: user.id
    });

    expect(application.status).toBe('applied');

  });

  it('should fail if the bounty does not exist', async () => {

    try {
      await createApplication({
        bountyId: v4(),
        message: 'My application message',
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }

  });

  it('should fail if the user already has an application for this bounty', async () => {

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: user.id,
      spaceId: space.id
    });

    await createApplication({
      bountyId: bounty.id,
      message: 'First application',
      userId: user.id
    });

    try {
      await createApplication({
        bountyId: bounty.id,
        message: 'Second application',
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DuplicateDataError);
    }

  });

  it(`should fail if the application message has less than ${MINIMUM_APPLICATION_MESSAGE_CHARACTERS} characters`, async () => {

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: user.id,
      spaceId: space.id
    });

    try {
      await createApplication({
        bountyId: bounty.id,
        message: '',
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(StringTooShortError);
    }

  });

  it('should fail if the cap of applications for the bounty has been reached', async () => {

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: user.id,
      spaceId: space.id,
      status: 'suggestion',
      maxSubmissions: 0
    });

    try {
      await createApplication({
        bountyId: bounty.id,
        message: 'My extended message',
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(LimitReachedError);
    }

  });

});

