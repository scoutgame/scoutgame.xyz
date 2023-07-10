import { SubscriptionRequiredError, UnauthorisedActionError } from '@charmverse/core/errors';
import type { Space, SpaceApiToken, SuperApiToken, User } from '@charmverse/core/prisma';
import type { ApiPageKey, Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtils, testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import type { NextApiRequest } from 'next';
import { v4 as uuid } from 'uuid';

import { generateUserAndSpace } from 'testing/setupDatabase';

import { InvalidApiKeyError } from '../errors';
import { provisionApiKey, requireApiKey } from '../requireApiKey';
import { requireApiPageKey } from '../requireApiPagekey';

describe('requireApiPageKey', () => {
  it('should identify the apiPageKey from the query and set it on the request', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });
    const apiPageKey = await prisma.apiPageKey.create({
      data: {
        apiKey: uuid(),
        type: 'typeform',
        page: { connect: { id: page.id } },
        user: { connect: { id: user.id } }
      }
    });

    const testReq: Partial<NextApiRequest> = {
      query: {
        apiPageKey: apiPageKey.apiKey
      }
    };
    const mockedNext = jest.fn();

    await requireApiPageKey(testReq as any, {} as any, mockedNext);

    expect(testReq.apiPageKey).toMatchObject({
      ...apiPageKey,
      page: { spaceId: space.id }
    });
  });

  it('should throw an error if the space is a free space', async () => {
    const { space: freeSpace, user: freeSpaceUser } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });
    const freeSpacePage = await testUtilsPages.generatePage({
      createdBy: freeSpaceUser.id,
      spaceId: freeSpace.id
    });
    const freeSpaceApiPageKey = await prisma.apiPageKey.create({
      data: {
        apiKey: uuid(),
        type: 'typeform',
        page: { connect: { id: freeSpacePage.id } },
        user: { connect: { id: freeSpaceUser.id } }
      }
    });

    const testReq: NextApiRequest = {
      query: {
        apiPageKey: freeSpaceApiPageKey.apiKey
      }
    } as any;

    await expect(requireApiPageKey(testReq, {} as any, () => null)).rejects.toBeInstanceOf(SubscriptionRequiredError);
  });

  it('should throw an error if the api key does not exist', async () => {
    const testReq: NextApiRequest = {
      query: {
        apiPageKey: uuid()
      }
    } as any;

    await expect(requireApiPageKey(testReq, {} as any, () => null)).rejects.toBeInstanceOf(InvalidApiKeyError);
  });
});
