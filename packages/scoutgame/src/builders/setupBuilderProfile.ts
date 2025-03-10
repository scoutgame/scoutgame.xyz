import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { authSecret, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '@packages/utils/constants';
import { GET as httpGET, POST as httpPOST } from '@packages/utils/http';
import { unsealData } from 'iron-session';

import { approveBuilder } from './approveBuilder';

export async function setupBuilderProfile({
  code,
  state,
  inviteCode
}: {
  code: string;
  state: string;
  inviteCode: string | null;
}) {
  const clientId = GITHUB_CLIENT_ID;
  const clientSecret = GITHUB_CLIENT_SECRET;

  if (!state) {
    throw new Error('Invalid connection url');
  }

  const unsealedUserId = await unsealData<{ id: string }>(state, { password: authSecret as string }).then(
    (data) => data?.id as string
  );

  if (!unsealedUserId) {
    throw new Error('User required');
  }

  const scout = await prisma.scout.findUnique({
    where: {
      id: unsealedUserId
    }
  });

  if (!scout) {
    throw new Error('User not found');
  }

  const tokenData = await httpPOST<{ access_token: string }>(
    `https://github.com/login/oauth/access_token`,
    {
      client_id: clientId,
      client_secret: clientSecret,
      code
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );

  const accessToken = tokenData.access_token;

  if (!accessToken) {
    throw new Error('Failed to authenticate Github account');
  }

  // Fetch the GitHub user's info
  const userResponse = await httpGET<{ login: string; name: string; email: string; id: number }>(
    'https://api.github.com/user',
    undefined,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  const githubLogin = userResponse.login;

  if (!githubLogin) {
    throw new Error('Failed to fetch Github user');
  }

  const githubUser = await prisma.githubUser.findFirst({
    where: {
      login: githubLogin
    }
  });

  // handle existing github user tied to a different builder
  if (githubUser?.builderId && githubUser.builderId !== unsealedUserId) {
    log.warn('Github user already in use', {
      githubLogin,
      userId: unsealedUserId
    });
    throw new Error('Account is already in use');
  }

  log.info('Connecting github profile to new builder', {
    githubLogin,
    alreadyExists: !!githubUser,
    displayName: userResponse.name,
    id: userResponse.id,
    userId: unsealedUserId
  });

  await prisma.githubUser.upsert({
    where: {
      login: githubLogin
    },
    create: {
      builderId: unsealedUserId,
      login: githubLogin,
      displayName: userResponse.name,
      email: userResponse.email,
      id: userResponse.id
    },
    update: {
      builderId: unsealedUserId
    }
  });

  // mark builder as applied if they haven't been marked as such yet
  if (scout.builderStatus === null) {
    await prisma.scout.update({
      where: {
        id: unsealedUserId
      },
      data: {
        builderStatus: 'applied',
        onboardedAt: new Date()
      }
    });
  } else {
    log.info(`Builder already applied: ${scout.builderStatus}`, {
      userId: unsealedUserId
    });
  }

  return scout;
}
