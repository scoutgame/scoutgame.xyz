import type { Space } from '@prisma/client';
import { v4 as uuid } from 'uuid';

import type { LoggedInUser } from 'models';

export function createMockUser(user?: Partial<LoggedInUser>): LoggedInUser {
  return {
    id: uuid(),
    avatar: null,
    avatarChain: null,
    avatarContract: null,
    avatarTokenId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    isBot: false,
    email: 'user@charmverse.io',
    emailNewsletter: false,
    emailNotifications: false,
    identityType: 'Wallet',
    username: uuid(),
    path: uuid(),
    spacesOrder: [],
    xpsEngineId: null,
    wallets: [
      {
        ensname: null,
        address: '0x0000000000000000000000000000000000000000'
      }
    ],
    spaceRoles: [],
    unstoppableDomains: [],
    favorites: [],
    googleAccounts: [],
    verifiedEmails: [],
    ...user
  };
}

export const createMockSpace = (space?: Partial<Space>): Space => {
  const newUserId = uuid();
  return {
    id: uuid(),
    deletedAt: null,
    createdAt: new Date(),
    createdBy: newUserId,
    updatedAt: new Date(),
    updatedBy: newUserId,
    name: 'Test Space',
    domain: 'test-space',
    discordServerId: null,
    defaultVotingDuration: null,
    snapshotDomain: null,
    spaceImage: null,
    defaultPostCategoryId: null,
    defaultPagePermissionGroup: null,
    defaultPublicPages: null,
    permissionConfigurationMode: null,
    publicBountyBoard: null,
    xpsEngineId: null,
    superApiTokenId: null,
    webhookSubscriptionUrl: null,
    webhookSigningSecret: null,
    hiddenFeatures: [],
    ...space
  };
};
