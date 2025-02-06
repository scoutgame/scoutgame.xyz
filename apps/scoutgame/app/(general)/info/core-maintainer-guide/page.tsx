import { CoreMaintainerGuidePage } from '@packages/scoutgame-ui/components/info/pages/CoreMaintainerGuidePage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Core Maintainer Guide'
};

export default async function CoreMaintainerGuide() {
  return <CoreMaintainerGuidePage />;
}
