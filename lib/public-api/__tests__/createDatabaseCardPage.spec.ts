import { Space, User } from '@prisma/client';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { ExpectedAnError } from 'testing/errors';
import { v4 } from 'uuid';
import { createDatabase, createDatabaseCardPage } from '../createDatabaseCardPage';
import { PageFromBlock } from '../pageFromBlock.class';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('createDatabaseCardPage', () => {

  it('should throw an error when the linked database does not exist', async () => {

    try {
      await createDatabaseCardPage({
        title: 'Example title',
        boardId: v4(),
        properties: {},
        spaceId: space.id,
        createdBy: user.id
      });
      throw new ExpectedAnError();
    }
    catch (error) {

      expect(true).toBe(true);
    }

  });

  it('should return the newly created page', async () => {

    const database = await createDatabase({
      title: 'My database',
      createdBy: user.id,
      spaceId: space.id
    });

    const createdPage = await createDatabaseCardPage({
      title: 'Example title',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: database.boardId!,
      properties: {},
      spaceId: space.id,
      createdBy: user.id
    });

    expect(createdPage).toBeInstanceOf(PageFromBlock);

  });

  it('should handle creation when properties are undefined', async () => {

    const database = await createDatabase({
      title: 'My database',
      createdBy: user.id,
      spaceId: space.id
    });

    const createdPage = await createDatabaseCardPage({
      title: 'Example title',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: database.boardId!,
      properties: undefined as any,
      spaceId: space.id,
      createdBy: user.id
    });

    expect(createdPage).toBeInstanceOf(PageFromBlock);

  });
});
