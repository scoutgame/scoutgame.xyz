import { NewsDashboard } from 'components/news/NewsDashboard';
import { getNews } from 'lib/news/getNews';

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const news = await getNews();
  return <NewsDashboard news={news} />;
}
