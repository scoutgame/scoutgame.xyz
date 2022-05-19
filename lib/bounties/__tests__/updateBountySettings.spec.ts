
import { Bounty, Space, User } from '@prisma/client';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { createBounty } from '../createBounty';
import { UpdateableBountyFields } from '../interfaces';
import { updateBountySettings } from '../updateBountySettings';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('updateBountySettings', () => {

  it("should be able to update 'title' | 'descriptionNodes' | 'description' | 'reviewer' | 'chainId' | 'rewardAmount' | 'rewardToken' | 'approveSubmitters' | 'maxSubmissions'", async () => {

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      // Different values from what will be updated
      title: 'My bounty',
      approveSubmitters: true,
      chainId: 2,
      description: 'Old description',
      descriptionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"text":"Old description","type":"text"}]}]}',
      maxSubmissions: 3,
      // No reviewer initially
      reviewer: null,
      rewardAmount: 4,
      rewardToken: 'ETH'
    });

    const newContent: UpdateableBountyFields = {
      title: 'New title',
      approveSubmitters: false,
      chainId: 1,
      description: 'New description',
      descriptionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"text":"New description","type":"text"}]}]}',
      maxSubmissions: 30,
      reviewer: user.id,
      rewardAmount: 40,
      rewardToken: 'BNB'
    };

    const updatedBounty = await updateBountySettings({
      bountyId: bounty.id,
      updateContent: newContent
    });

    (Object.keys(newContent) as (keyof UpdateableBountyFields)[]).forEach(key => {
      expect(updatedBounty[key]).toBe(newContent[key]);
    });

  });

  it('should not be able to update the status', async () => {

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      title: 'My bounty',
      status: 'suggestion'
    });

    const newContent: Partial<Bounty> = {
      status: 'complete'
    };

    const updatedBounty = await updateBountySettings({
      bountyId: bounty.id,
      updateContent: newContent
    });

    expect(updatedBounty.status).toBe('suggestion');

  });

});

