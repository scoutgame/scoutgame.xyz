/* eslint-disable @typescript-eslint/no-unused-vars */
import { Application, Bounty, BountyPermissionLevel, Space, User } from '@prisma/client';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty, generateBountyWithSingleApplication, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { ApplicationCreationData, SubmissionCreationData, SubmissionReview } from 'lib/applications/interfaces';
import { AssignedBountyPermissions, createBounty } from 'lib/bounties';
import { generateSubmissionContent } from 'testing/generate-stubs';
import { countValidSubmissions } from 'lib/applications/shared';
import { BountyWithDetails } from 'models';
import { prisma } from 'db';
import { typedKeys } from 'lib/utilities/objects';

let nonAdminUser: User;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  nonAdminUserSpace = generated.space;
  nonAdminCookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: nonAdminUser.addresses[0]
    })).headers['set-cookie'][0];
});

describe('GET /api/bounties/{bountyId}/permissions - Return assigned and individual permissions for a bounty', () => {

  it('should return the bounty query and computed user permissions for a bounty and respond with 200', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const extraUserCookie = await loginUser(extraUser);

    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const { bountyPermissions, userPermissions } = (await request(baseUrl)
      .get(`/api/bounties/${bounty.id}/permissions`)
      .set('Cookie', extraUserCookie)
      .expect(200)).body as AssignedBountyPermissions;

    expect(bountyPermissions).toBeDefined();
    expect(userPermissions).toBeDefined();

    // Verify user permissions shape
    typedKeys(userPermissions).forEach(key => {
      expect(typeof userPermissions[key] as any).toEqual('boolean');
    });

    // Verify rollup across levels and assignments
    typedKeys(BountyPermissionLevel).forEach(key => {
      expect(bountyPermissions[key]).toBeInstanceOf(Array);
    });

  });

  it('should respond with empty permissions if user does not have view permission', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const extraUserCookie = await loginUser(extraUser);

    // Bounty with a base permission set
    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const { bountyPermissions, userPermissions } = (await request(baseUrl)
      .get(`/api/bounties/${bounty.id}/permissions`)
      .set('Cookie', extraUserCookie)
      .expect(200)).body as AssignedBountyPermissions;

    expect(bountyPermissions).toBeDefined();
    expect(userPermissions).toBeDefined();

    // Make sure access is full false
    typedKeys(userPermissions).forEach(key => {
      expect(userPermissions[key] as any).toBe(false);
    });

    // Make sure it's empty everywhere and doesn't leak info about roles
    typedKeys(BountyPermissionLevel).forEach(key => {
      expect(bountyPermissions[key].length).toBe(0);
    });
  });

});
