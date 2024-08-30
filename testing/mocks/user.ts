import type { LoggedInUser } from '@root/models';
import { v4 as uuid } from 'uuid';

import { deterministicRandomName } from 'lib/utils/randomName';

export function createMockUser(user?: Partial<LoggedInUser>): LoggedInUser {
  const id = user?.id ?? uuid();
  return {
    primaryWalletId: null,
    publishToLensDefault: false,
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
    username: deterministicRandomName(id),
    path: uuid(),
    spacesOrder: [],
    wallets: [
      {
        ensname: null,
        address: '0x0000000000000000000000000000000000000000',
        id: uuid()
      }
    ],
    spaceRoles: [],
    favorites: [],
    googleAccounts: [],
    verifiedEmails: [],
    ...user
  } as LoggedInUser;
}
