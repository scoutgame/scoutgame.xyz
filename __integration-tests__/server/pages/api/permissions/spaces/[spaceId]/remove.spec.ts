import { addSpaceOperations, SpacePermissionFlags, SpacePermissionModification } from 'lib/permissions/spaces';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/permissions/space/{spaceId}/remove - Remove space permissions', () => {

  it('should succeed if the user is a space admin, sending back available operations for target group and respond 200', async () => {

    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createBounty', 'createPage'],
      spaceId: space.id
    });

    const adminCookie = await loginUser(adminUser);

    const toRemove: SpacePermissionModification = {
      forSpaceId: space.id,
      operations: ['createPage'],
      spaceId: space.id
    };

    const updatedPermissions = (await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/remove`)
      .set('Cookie', adminCookie)
      .send(toRemove)
      .expect(200)).body as SpacePermissionFlags;

    expect(updatedPermissions.createBounty).toBe(true);
    expect(updatedPermissions.createPage).toBe(false);

  });

  it('should fail if the user is not a space admin, and respond 401', async () => {

    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const permissionActionContent: SpacePermissionModification = {
      forSpaceId: space.id,
      operations: ['createBounty'],
      spaceId: space.id
    };

    const nonAdminCookie = await loginUser(nonAdminUser);

    await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/remove`)
      .set('Cookie', nonAdminCookie)
      .send(permissionActionContent)
      .expect(401);

  });

});
