import type { Metadata } from 'next';

import { GoodDollarPage } from 'components/info/partner-rewards/GoodDollarPage';

export const metadata: Metadata = {
  title: 'GoodDollar Partner Rewards'
};

export default async function Celo() {
  return <GoodDollarPage />;
}
