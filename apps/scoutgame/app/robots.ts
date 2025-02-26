import { getPlatform } from '@packages/utils/platform';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const platform = getPlatform();
  const disallowRobots = platform === 'telegram' || platform === 'farcaster';

  return {
    rules: {
      userAgent: '*',
      allow: disallowRobots ? undefined : '/',
      disallow: disallowRobots ? '/' : undefined
    }
  };
}
