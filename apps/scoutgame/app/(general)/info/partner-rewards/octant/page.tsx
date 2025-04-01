import type { Metadata } from 'next';

import { OctantPage } from 'components/info/partner-rewards/OctantPage';

export const metadata: Metadata = {
  title: 'Octant Partner Rewards'
};

export default async function Octant() {
  return <OctantPage />;
}
