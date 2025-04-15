import { DraftRegisterPage } from 'components/draft/DraftRegisterPage';

export default function Page(params: { searchParams: { search: string } }) {
  const search = params.searchParams.search;
  return <DraftRegisterPage search={search} />;
}
