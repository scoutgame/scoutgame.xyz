
import { prisma } from 'db';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { createPagePermission } from '../page-permission-actions';
import { breakInheritance, resolveChildPages } from '../refresh-page-permission-tree';

describe('breakInheritance', () => {
  it('should convert all permissions inherited by the page to permissions owned by the page', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken();

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await createPagePermission({
      pageId: root.id,
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const childPermission = await createPagePermission({
      pageId: child.id,
      permissionLevel: 'full_access',
      spaceId: space.id,
      inheritedFromPermission: rootPermission.id
    });

    const updatedPage = await breakInheritance(child.id);

    expect(updatedPage.permissions.length).toBe(1);
    expect(updatedPage.permissions[0].permissionLevel).toBe('full_access');
    expect(updatedPage.permissions[0].inheritedFromPermission).toBeNull();

  });

  it('should update inherited permissions for child pages of the page to now inherit from this page', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await createPagePermission({
      pageId: root.id,
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const childPermission = await createPagePermission({
      pageId: child.id,
      permissionLevel: 'full_access',
      spaceId: space.id,
      inheritedFromPermission: rootPermission.id
    });

    const subChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChild1Permission = await createPagePermission({
      pageId: subChild1.id,
      permissionLevel: 'full_access',
      spaceId: space.id,
      inheritedFromPermission: rootPermission.id
    });

    const subChild2 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChild2Permission = await createPagePermission({
      pageId: subChild2.id,
      permissionLevel: 'full_access',
      spaceId: space.id,
      inheritedFromPermission: rootPermission.id
    });

    const subSubChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subChild1.id
    });

    const subSubChild1Permission = await createPagePermission({
      pageId: subChild1.id,
      permissionLevel: 'full_access',
      spaceId: space.id,
      inheritedFromPermission: rootPermission.id
    });

    await breakInheritance(child.id);

    const children = await resolveChildPages(child.id);

    children.forEach(nestedPage => {
      nestedPage.permissions.forEach(nestedPagePermission => {
        expect(nestedPagePermission.inheritedFromPermission).toBe(childPermission.id);

      });
    });
  });

  it('should leave the locally defined permissions for child pages unchanged', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await createPagePermission({
      pageId: root.id,
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const childPermission = await createPagePermission({
      pageId: child.id,
      permissionLevel: 'full_access',
      spaceId: space.id,
      inheritedFromPermission: rootPermission.id
    });

    const subChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChild1Permission = await createPagePermission({
      pageId: subChild1.id,
      permissionLevel: 'full_access',
      spaceId: space.id,
      inheritedFromPermission: rootPermission.id
    });

    const subChild1LocalPermission = await createPagePermission({
      pageId: subChild1.id,
      permissionLevel: 'view',
      userId: user.id
    });

    await breakInheritance(child.id);

    const nestedPage = await prisma.page.findUnique({
      where: {
        id: subChild1.id
      },
      include: {
        permissions: true
      }
    });

    expect(nestedPage?.permissions.length).toBe(2);

    const localPermission = nestedPage?.permissions.find(permission => permission.id === subChild1LocalPermission.id);

    expect(localPermission?.inheritedFromPermission).toBeNull();

  });
});

describe('resolveChildPages', () => {
  it('should return a list of all children of a page', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const subChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChild2 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subSubChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subChild1.id
    });

    const subSubChild2 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subChild1.id
    });

    const subSubChild3 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subChild1.id
    });

    const subSubSubChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subSubChild1.id
    });

    const subSubSubSubChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subSubSubChild1.id
    });

    const resolvedChildren = await resolveChildPages(child.id);

    expect(resolvedChildren.length).toBe(7);
    expect(resolvedChildren.find(page => page.id === subChild1.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subChild2.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subSubChild1.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subSubChild2.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subSubChild3.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subSubSubChild1.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subSubSubSubChild1.id)).toBeDefined();
  });
});
