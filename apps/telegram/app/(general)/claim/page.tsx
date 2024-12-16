import { ClaimPage } from '@packages/scoutgame-ui/components/claim/ClaimPage';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Claim Points'
};

export default async function Claim({ searchParams }: { searchParams: { tab: string } }) {
  return <ClaimPage period={searchParams.tab} />;
}
