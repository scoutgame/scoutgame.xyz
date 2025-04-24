import env from '@beam-australia/react-env';

// Environment
export const isTestEnv = (env('APP_ENV') ?? process.env.REACT_APP_APP_ENV ?? process.env.NODE_ENV) === 'test';
export const isStagingEnv = (env('APP_ENV') ?? process.env.REACT_APP_APP_ENV) === 'staging';
export const isProdEnv = process.env.NODE_ENV === 'production' && !isTestEnv && !isStagingEnv;
export const isDevEnv =
  (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && !isProdEnv && !isStagingEnv && !isTestEnv;

// Session
export const baseUrl = process.env.DOMAIN as string | undefined;
export const authSecret = process.env.AUTH_SECRET as string | undefined;
export const cookieName = process.env.AUTH_COOKIE || 'scoutgame-session';

export const GITHUB_CLIENT_ID = env('GITHUB_CLIENT_ID') ?? process.env.REACT_APP_GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export const decentApiKey = env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string);

export const whiteListedUserIds = [
  // Matt
  '00c4af4f-b0f8-41e8-b27d-29996d694034',
  // Chris
  'b6cb2938-91dd-4274-8d85-aa2e00eb97e2',
  // Safwan
  'f534b485-b7d5-47c3-92d8-02d107158558',
  // test scout
  'b5016a86-3a3e-4b0d-8f52-cf29599b9fc8',
  // Alex
  '4cbfa422-70a2-400e-8b37-71e3d1e74dfb',
  // Andy
  '00b5a425-3c3c-4be7-9784-b7510a35bf37'
];
