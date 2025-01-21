import { getPlatform } from '@packages/mixpanel/platform';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const platform = getPlatform();
  const disallowRobots = platform === 'telegram';

  return {
    rules: {
      userAgent: '*',
      allow: disallowRobots ? undefined : '/',
      disallow: disallowRobots ? '/' : undefined
    }
  };
}
