import { getPlatform } from '@packages/mixpanel/platform';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const platform = getPlatform();
  const isTelegram = platform === 'telegram';

  return {
    rules: {
      userAgent: '*',
      allow: isTelegram ? undefined : '/',
      disallow: isTelegram ? '/' : undefined
    }
  };
}
