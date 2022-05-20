
import { Bounty, BountyStatus, PageOperations, PagePermissionLevel, Space, User } from '@prisma/client';
import { computeUserPagePermissions, permissionTemplates, upsertPermission } from 'lib/permissions/pages';
import { createPage, generateUserAndSpaceWithApiToken, generateBountyWithSingleApplication, generateSpaceUser, generateBounty } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { ExpectedAnError } from 'testing/errors';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { DataNotFoundError, InvalidInputError, UnauthorisedActionError, LimitReachedError, PositiveNumbersOnlyError, DuplicateDataError, StringTooShortError, MissingDataError } from 'lib/utilities/errors';
import { createBounty } from 'lib/bounties/createBounty';
import { prisma } from 'db';
import { generateSubmissionContent } from 'testing/generate-stubs';
import { createApplication } from '../createApplication';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from '../../shared';
import { createSubmission } from '../createSubmission';
import { SubmissionContent, SubmissionUpdateData } from '../../interfaces';
import { updateSubmission } from '../updateSubmission';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('updateSubmission', () => {

  it('should return the updated submission', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: null
    });

    const submissionUpdate: SubmissionContent = {
      submission: 'New content',
      submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"New content"}]}]}'
    };

    const updated = await updateSubmission({
      submissionId: bountyWithSubmission.applications[0].id,
      submissionContent: submissionUpdate
    });

    expect(updated.submission).toBe(submissionUpdate.submission);
    expect(updated.submissionNodes).toBe(submissionUpdate.submissionNodes);

  });

  it('should fail if the submission does not exist', async () => {

    try {
      await updateSubmission({
        submissionId: v4(),
        submissionContent: generateSubmissionContent()
      });
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if empty submission content is provided', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: null
    });

    const submissionUpdate: SubmissionContent = {
      submission: '',
      submissionNodes: null
    };

    try {
      await updateSubmission({
        submissionId: bountyWithSubmission.applications[0].id,
        submissionContent: submissionUpdate
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(MissingDataError);
    }
  });

  it('should fail if the bounty is not open or in progress', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'complete',
      applicationStatus: 'inProgress',
      bountyCap: null
    });

    const submissionUpdate: SubmissionContent = generateSubmissionContent();

    try {
      await updateSubmission({
        submissionId: bountyWithSubmission.applications[0].id,
        submissionContent: submissionUpdate
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(UnauthorisedActionError);
    }
  });

  it('should fail if the application is not in progress or in review', async () => {
    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'complete',
      bountyCap: null
    });

    const submissionUpdate: SubmissionContent = generateSubmissionContent();

    try {
      await updateSubmission({
        submissionId: bountyWithSubmission.applications[0].id,
        submissionContent: submissionUpdate
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(UnauthorisedActionError);
    }
  });

});

