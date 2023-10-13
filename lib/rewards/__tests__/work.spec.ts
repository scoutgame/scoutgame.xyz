import type { Application } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import { InvalidInputError, LimitReachedError, WrongStateError } from 'lib/utilities/errors';
import { generateBounty, generateUserAndSpace } from 'testing/setupDatabase';

import type { WorkUpsertData } from '../work';
import { work } from '../work';

let user: any;
let space: any;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

describe('work', () => {
  it('should create an application if reward requires applications, and a submission if not', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5
    });

    const applicationData: WorkUpsertData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Sample message for testing',
      submission: 'Sample submission data',
      submissionNodes: '{}'
    };

    const application = await work(applicationData);

    expect(application).toMatchObject(
      expect.objectContaining<Partial<Application>>({
        status: 'applied',
        acceptedBy: null, // you might want to fill in specific values here if necessary
        bountyId: expect.any(String), // assuming it's a string type, adjust if needed
        createdAt: expect.any(Date),
        createdBy: expect.any(String), // adjust type if needed
        id: expect.any(String),
        message: expect.any(String),
        reviewedBy: null, // or expect.any(String) if it's supposed to be a string
        spaceId: expect.any(String),
        submission: expect.any(String),
        submissionNodes: expect.any(String), // this is the stringified JSON or regular string
        updatedAt: expect.any(Date),
        walletAddress: null // or expect.any(String) if it's supposed to be a string
      })
    );

    // If user applies at a time where approveSubmitters is false
    await prisma.bounty.update({
      where: {
        id: reward.id
      },
      data: {
        approveSubmitters: false
      }
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const submission = await work({ ...applicationData, userId: spaceMember.id });

    expect(submission).toMatchObject(
      expect.objectContaining<Partial<Application>>({
        status: 'inProgress',
        acceptedBy: null, // you might want to fill in specific values here if necessary
        bountyId: expect.any(String), // assuming it's a string type, adjust if needed
        createdAt: expect.any(Date),
        createdBy: expect.any(String), // adjust type if needed
        id: expect.any(String),
        message: expect.any(String),
        reviewedBy: null, // or expect.any(String) if it's supposed to be a string
        spaceId: expect.any(String),
        submission: expect.any(String),
        submissionNodes: expect.any(String), // this is the stringified JSON or regular string
        updatedAt: expect.any(Date),
        walletAddress: null // or expect.any(String) if it's supposed to be a string
      })
    );
  });

  // Error Cases

  it('should fail if Submission cap reached', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 2
    });

    const applicationData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Sample message for testing',
      submission: 'Sample submission data',
      submissionNodes: '{}',
      status: 'applied'
    };

    // Cap is reached when enough reward submissions are marked as complete
    await prisma.application.createMany({
      data: [1, 2, 3, 4].map(() => ({ bountyId: reward.id, createdBy: user.id, spaceId: space.id, status: 'complete' }))
    });

    await expect(work(applicationData)).rejects.toThrow(LimitReachedError);
  });

  it('should fail to create an application if the reward is marked complete', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 2,
      status: 'complete'
    });

    const applicationData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Sample message for testing',
      submission: 'Sample submission data',
      submissionNodes: '{}',
      status: 'applied'
    };

    await expect(work(applicationData)).rejects.toThrow(WrongStateError);
  });

  it('should update an existing application', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5
    });

    const applicationData: WorkUpsertData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Original message',
      submission: 'Original submission data',
      submissionNodes: '{}'
    };

    const application = await work(applicationData);

    const updatedApplicationData: WorkUpsertData = {
      userId: user.id,
      rewardId: reward.id,
      applicationId: application.id,
      message: 'Updated message',
      submission: 'Updated submission data'
    };

    const updatedApplication = await work(updatedApplicationData);

    expect(updatedApplication.message).toBe('Updated message');
    expect(updatedApplication.submission).toBe('Updated submission data');
  });

  it("should throw an error if updating another user's application", async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5
    });

    const applicationData: WorkUpsertData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Original message',
      submission: 'Original submission data',
      submissionNodes: '{}'
    };

    const application = await work(applicationData);

    const otherUser = await testUtilsUser.generateUser();

    const invalidUpdateData: WorkUpsertData = {
      userId: otherUser.id,
      rewardId: reward.id,
      applicationId: application.id,
      message: 'Invalid update',
      submission: 'Invalid update data'
    };

    await expect(work(invalidUpdateData)).rejects.toThrow(InvalidInputError);
  });

  it('should throw an error if provided with an invalid application ID', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5
    });

    const invalidApplicationIdData: WorkUpsertData = {
      userId: user.id,
      rewardId: reward.id,
      applicationId: 'invalidId',
      message: 'Invalid application ID test',
      submission: 'Invalid application ID data'
    };

    // Depending on how your upsert handles invalid IDs, you might expect another error. Adjust as necessary.
    await expect(work(invalidApplicationIdData)).rejects.toThrow(InvalidInputError);
  });

  it('should fail if allowMultipleApplications is false and user tries to create a second application', async () => {
    // Assuming you've already created an application for the user previously
    // Or, add logic here to create an initial application for the user

    // Mock or set up your data to make sure the reward has allowMultipleApplications set to false
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5,
      all
    });
    // The data for the second application attempt by the user
    const applicationData = {
      // ...yourApplicationData,
      // Do not include applicationId to simulate creating a new application
    };

    const invalidApplicationIdData: WorkUpsertData = {
      userId: user.id,
      rewardId: reward.id,
      applicationId: 'invalidId',
      message: 'Invalid application ID test',
      submission: 'Invalid application ID data'
    };

    // Depending on how your upsert handles invalid IDs, you might expect another error. Adjust as necessary.
    await expect(work(invalidApplicationIdData)).rejects.toThrow(InvalidInputError);

    // Assume the function `work` would throw an error if a second application is attempted
    // when allowMultipleApplications is set to false.
    await expect(work(applicationData)).rejects.toThrow(SomeSpecificErrorType); // Replace with your error type
  });

  it('should handle rewardInfo correctly', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5
    });

    const applicationDataWithRewardInfo: WorkUpsertData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Message with reward info',
      submission: 'Submission with reward info',
      submissionNodes: '{}',
      rewardInfo: 'Sample reward info'
    };

    const application = await work(applicationDataWithRewardInfo);

    expect(application.rewardInfo).toBe('Sample reward info');

    const updatedApplication = await work({ ...applicationDataWithRewardInfo, rewardInfo: 'New reward info' });

    expect(updatedApplication.rewardInfo).toBe('New reward info');
  });
});
