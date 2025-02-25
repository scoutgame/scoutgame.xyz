import env from '@beam-australia/react-env';
import { ReferralPlatform } from '@charmverse/core/prisma';

const platform = env('SCOUTGAME_PLATFORM') || process.env.REACT_APP_SCOUTGAME_PLATFORM;

function isPlatform(_platform: string = ''): _platform is ReferralPlatform {
  const availablePlatforms = Object.values(ReferralPlatform);

  return availablePlatforms.includes(_platform as ReferralPlatform);
}

export function getPlatform(): ReferralPlatform {
  if (isPlatform(platform)) {
    return platform;
  }

  return 'unknown';
}
