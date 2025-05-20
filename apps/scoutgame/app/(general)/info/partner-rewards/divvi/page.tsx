import type { Metadata } from 'next';

import { DivviPage } from 'components/info/partner-rewards/DivviPage';

export const metadata: Metadata = {
  title: 'Divvi Partner Rewards'
};

export default async function Divvi() {
  return <DivviPage />;
}
