import { OctantPage } from '@packages/scoutgame-ui/components/info/partner-rewards/OctantPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Octant Partner Rewards'
};

export default async function Octant() {
  return <OctantPage />;
}
