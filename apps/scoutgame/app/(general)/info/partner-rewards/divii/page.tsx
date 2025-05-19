import type { Metadata } from 'next';

import { DiviiPage } from 'components/info/partner-rewards/DiviiPage';

export const metadata: Metadata = {
  title: 'Divii Partner Rewards'
};

export default async function Divii() {
  return <DiviiPage />;
}
