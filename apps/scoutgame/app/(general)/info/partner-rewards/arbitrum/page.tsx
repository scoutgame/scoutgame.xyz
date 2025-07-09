import type { Metadata } from 'next';

import { ArbitrumPage } from 'components/info/partner-rewards/ArbitrumPage';

export const metadata: Metadata = {
  title: 'Arbitrum Partner Rewards'
};

export default async function ArbitrumPartnerRewards() {
  return <ArbitrumPage />;
}
