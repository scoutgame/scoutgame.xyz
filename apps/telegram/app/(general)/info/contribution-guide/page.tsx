import { ContributionGuidePage } from '@packages/scoutgame-ui/components/info/pages/ContributionGuidePage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contribution Guide'
};

export default async function ContributionGuide() {
  return <ContributionGuidePage />;
}
