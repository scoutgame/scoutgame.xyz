import { GoodDollarPage } from '@packages/scoutgame-ui/components/info/partner-rewards/GoodDollarPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GoodDollar Partner Rewards'
};

export default async function Celo() {
  return <GoodDollarPage />;
}
