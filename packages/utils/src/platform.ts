import env from '@beam-australia/react-env';
import type { ReferralPlatform } from '@charmverse/core/prisma';

const availablePlatforms: ReferralPlatform[] = ['telegram', 'farcaster', 'webapp', 'unknown'];

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
