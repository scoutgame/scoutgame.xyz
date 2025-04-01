import type { Metadata } from 'next';

import { ContributionGuidePage } from 'components/info/pages/ContributionGuidePage';

export const metadata: Metadata = {
  title: 'Contribution Guide'
};

export default async function ContributionGuide() {
  return <ContributionGuidePage />;
}
