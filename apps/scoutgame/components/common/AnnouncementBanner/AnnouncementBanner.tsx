import { cookies } from 'next/headers';

import { AnnouncementBannerAlert } from './components/Alert';
import { currentBanner, BANNERS_COOKIE_KEY } from './config';

// Server component to get cookies during server rendering
function getServerCookies() {
  try {
    // This will only work in a server component or route handler
    const cookieStore = cookies();
    return cookieStore.get(BANNERS_COOKIE_KEY)?.value;
  } catch (error) {
    // If called in client context, return undefined
    return undefined;
  }
}

export function AnnouncementBanner() {
  const lastSeenBanner = getServerCookies();

  if (
    // no current banner
    !currentBanner ||
    // seen by user already
    lastSeenBanner === currentBanner[0]
  ) {
    return null;
  }

  return <AnnouncementBannerAlert id={currentBanner[0]} message={currentBanner[1].description} />;
}
