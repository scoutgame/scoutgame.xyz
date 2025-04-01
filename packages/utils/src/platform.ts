import env from '@beam-australia/react-env';
import type { ReferralPlatform } from '@charmverse/core/prisma';

const availablePlatforms: ReferralPlatform[] = [
  'telegram',
  'farcaster',
  'webapp',
  'onchain_webapp',
  'onchain_cron',
  'unknown'
];

const platform = env('SCOUTGAME_PLATFORM') || process.env.REACT_APP_SCOUTGAME_PLATFORM;

function isPlatform(_platform: string = ''): _platform is ReferralPlatform {
  return availablePlatforms.includes(_platform as ReferralPlatform);
}

export function getPlatform(): ReferralPlatform {
  if (isPlatform(platform)) {
    return platform;
  }

  return 'unknown';
}

export function isOnchainPlatform() {
  return platform === 'onchain_webapp' || platform === 'onchain_cron';
}
