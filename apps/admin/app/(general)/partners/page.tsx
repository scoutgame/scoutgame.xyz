import { ScoutPartnersDashboard } from 'components/partners/ScoutPartnersDashboard';
import { getScoutPartners } from 'lib/scout-partners/getScoutPartners';

export const dynamic = 'force-dynamic';

export default async function PartnersPage() {
  const partners = await getScoutPartners();
  return <ScoutPartnersDashboard initialPartners={partners} />;
}
