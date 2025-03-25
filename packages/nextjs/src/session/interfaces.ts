import type { Scout } from '@charmverse/core/prisma-client';
import type { UTMParams } from '@packages/mixpanel/utils';
import type { IronSession } from 'iron-session';
import type { headers } from 'next/headers';

export type SessionData = {
  user?: { id: string };
  anonymousUserId?: string;
  utmParams?: UTMParams;
  scoutId?: string; // for ScoutGame, users in the scout database
  adminId?: string; // users in the admin webapp. should override scoutId
};

export type RequestContext = {
  session: IronSession<SessionData>;
  headers: ReturnType<typeof headers>;
};

export type SessionUser = Pick<
  Scout,
  | 'id'
  | 'path'
  | 'displayName'
  | 'avatar'
  | 'farcasterId'
  | 'farcasterName'
  | 'builderStatus'
  | 'currentBalance'
  | 'onboardedAt'
  | 'agreedToTermsAt'
  | 'bio'
  | 'referralCode'
  | 'deletedAt'
  | 'utmCampaign'
> & {
  primaryWallet?: string;
};
