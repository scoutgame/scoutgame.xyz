
import { PageOperations, PagePermissionLevel, User } from '@prisma/client';
import { computeUserPagePermissions, permissionTemplates, upsertPermission } from 'lib/permissions/pages';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { PageOperationType } from '../page-permission-interfaces';

let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
});

describe('computeUserPagePermissions', () => {

  it('should return the correct permissions for a user by combining all permissions they are eligible for', async () => {

    const { user: adminUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page = await createPage({
      createdBy: adminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions'
    });

    await Promise.all([
      upsertPermission(page.id, {
        permissionLevel: 'view',
        pageId: page.id,
        spaceId: localSpace.id
      }),
      upsertPermission(page.id, {
        permissionLevel: 'view_comment',
        pageId: page.id,
        userId: adminUser.id
      })
    ]);

    const permissions = await computeUserPagePermissions({
      pageId: page.id,
      userId: adminUser.id
    });

    const assignedPermissionLevels: PagePermissionLevel[] = ['view', 'view_comment'];

    assignedPermissionLevels.forEach(group => {
      permissionTemplates[group].forEach(op => {
        expect(permissions[op]).toBe(true);
      });
    });

    // Check a random higher level operation that shouldn't be true
    expect(permissions.grant_permissions).toBe(false);
  });

  it('should return full permissions if the user is an admin of the space linked to the page', async () => {

    const { user: adminUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    const page = await createPage({
      createdBy: adminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions'
    });

    const permissions = await computeUserPagePermissions({
      pageId: page.id,
      userId: adminUser.id
    });

    (Object.keys(PageOperations) as PageOperationType[]).forEach(op => {
      expect(permissions[op]).toBe(true);
    });

  });

  it('should return empty permissions if the page does not exist', async () => {
    const inexistentPageId = v4();

    const permissions = await computeUserPagePermissions({
      pageId: inexistentPageId,
      userId: user.id
    });

    (Object.keys(PageOperations) as PageOperationType[]).forEach(op => {
      expect(permissions[op]).toBe(false);
    });

  });

});
