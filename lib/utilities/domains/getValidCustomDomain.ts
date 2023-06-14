import { getValidDefaultHost } from 'lib/utilities/domains/getValidDefaultHost';
import { isLocalhostAlias } from 'lib/utilities/domains/isLocalhostAlias';

const BLACKLISTED_DOMAIN_NAMES = ['amazonaws.com'];

export function getValidCustomDomain(host?: string | null) {
  if (!host && typeof window !== 'undefined') {
    // On client side, get the host from window
    host = window.location.host;
  }

  if (isLocalhostAlias(host)) {
    return null;
  }

  const hostname = host?.split(':')[0];

  if (BLACKLISTED_DOMAIN_NAMES.some((domain) => hostname?.includes(domain))) {
    return null;
  }

  if (hostname && !/[a-z]/i.test(hostname)) {
    // hostname is an IP address - case not supported
    return null;
  }

  const defaultHost = getValidDefaultHost(hostname);

  if (defaultHost) {
    // app runs on default domain so space does not use custom domain
    return null;
  }

  return hostname || null;
}
