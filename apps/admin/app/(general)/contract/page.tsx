import { ContractDashboard } from 'components/contract/ContractDashboard';

export const dynamic = 'force-dynamic';

export default async function Dashboard({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = searchParams.tab as string;
  return <ContractDashboard currentTab={tab} />;
}
