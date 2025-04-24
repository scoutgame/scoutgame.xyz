import { ContractDashboard } from 'components/contract/ContractDashboard';

export const dynamic = 'force-dynamic';

export default async function Dashboard({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParamsResolved = await searchParams;
  const tab = searchParamsResolved.tab as string;
  return <ContractDashboard currentTab={tab} />;
}
