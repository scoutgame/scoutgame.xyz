import type { Metadata } from 'next';

import { CoreMaintainerGuidePage } from 'components/info/pages/CoreMaintainerGuidePage';

export const metadata: Metadata = {
  title: 'Core Maintainer Guide'
};

export default async function CoreMaintainerGuide() {
  return <CoreMaintainerGuidePage />;
}
