/* eslint-disable @typescript-eslint/no-unused-vars */
import { Space, User } from '@prisma/client';
import { BountySubmitterPoolCalculation, BountySubmitterPoolSize } from 'lib/bounties';
import { addBountyPermissionGroup } from 'lib/permissions/bounties';
import { assignRole } from 'lib/roles';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty, generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: User;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  nonAdminUserSpace = generated.space;
  nonAdminCookie = await loginUser(nonAdminUser);
});

describe('POST /api/bounties/{bountyId}/pool - Return breakdown of how many people can apply', () => {

  it('should return the bounty pool size based on current bounty permissions and respond with 200', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const extraUserCookie = await loginUser(extraUser);

    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const role = await generateRole({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id
    });

    await assignRole({
      roleId: role.id,
      userId: extraUser.id
    });

    // This should be ignored in following call
    await addBountyPermissionGroup({
      assignee: {
        group: 'role',
        id: role.id
      },
      level: 'submitter',
      resourceId: bounty.id
    });

    const { mode, roleups, total } = (await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/pool`)
      .set('Cookie', extraUserCookie)
      .send({})
      .expect(200)).body as BountySubmitterPoolSize;

    expect(mode === 'role').toBe(true);
    expect(roleups.length).toBe(1);
    // 1 space member assigned to role
    expect(total).toBe(1);
  });

  it('should return the bounty pool size based on a simulation of permissions and respond with 200', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });
    const secondExtraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const extraUserCookie = await loginUser(extraUser);

    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const role = await generateRole({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id
    });

    await assignRole({
      roleId: role.id,
      userId: extraUser.id
    });

    // This shouldn't be taken into account for our simulation
    const secondRole = await generateRole({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id
    });

    await assignRole({
      roleId: role.id,
      userId: secondExtraUser.id
    });

    await assignRole({
      roleId: secondRole.id,
      userId: secondExtraUser.id
    });

    const simulation: BountySubmitterPoolCalculation = {
      resourceId: bounty.id,
      permissions: {
        submitter: [{ group: 'role', id: role.id }]
      }
    };

    const { mode, roleups, total } = (await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/pool`)
      .set('Cookie', extraUserCookie)
      .send(simulation)
      .expect(200)).body as BountySubmitterPoolSize;

    expect(mode === 'role').toBe(true);
    expect(roleups.length).toBe(1);
    expect(roleups[0].id === role.id).toBe(true);

    // 2 users were assigned to 1 role
    expect(total).toBe(2);
  });

  it('should respond with empty permissions if user does not have view permission', async () => {

    const externalUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const externalUserCookie = await loginUser(externalUser);

    // Bounty with a base permission set
    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const { mode, roleups, total } = (await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/pool`)
      .set('Cookie', externalUserCookie)
      .send({})
      .expect(200)).body as BountySubmitterPoolSize;

    expect(mode).toBe('space');
    expect(roleups.length).toBe(0);
    expect(total).toBe(0);

  });

});
