import { headers } from 'next/headers';

/**
 * Get IP address from next/headers
 *
 * @returns IP address as string
 */
export async function getIPFromRequest() {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return undefined;
}
