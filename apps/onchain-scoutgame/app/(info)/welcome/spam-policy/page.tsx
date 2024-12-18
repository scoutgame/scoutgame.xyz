import { SpamPolicyPage } from '@packages/scoutgame-ui/components/welcome/spam-policy/SpamPolicyPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Spam policy'
};

export default async function SpamPolicy({ searchParams }: { searchParams: { 'profile-redirect': string } }) {
  return <SpamPolicyPage redirectToProfile={searchParams['profile-redirect'] === 'true'} />;
}
