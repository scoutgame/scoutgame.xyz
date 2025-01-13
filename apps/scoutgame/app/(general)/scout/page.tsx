import { getSession } from '@packages/nextjs/session/getSession';
import type { BuildersSortBy } from '@packages/scoutgame/builders/getBuilders';
import { ScoutPage } from '@packages/scoutgame-ui/components/scout/ScoutPage';

export default async function Scout({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const scoutSort = (searchParams.scoutSort as string) || 'points';
  const builderSort = (searchParams.builderSort as BuildersSortBy) || 'week_gems';
  const builderOrder = (searchParams.builderOrder as string) || 'asc';
  const scoutOrder = (searchParams.scoutOrder as string) || 'desc';
  const scoutTab = (searchParams.scoutTab as string) || 'scouts';
  const buildersLayout = (searchParams.buildersLayout as string) || 'table';
  const tab = (searchParams.tab as string) || 'scouts';
  const session = await getSession();
  const userId = session?.user?.id;
  return (
    <ScoutPage
      scoutSort={scoutSort}
      builderSort={builderSort}
      scoutOrder={scoutOrder}
      builderOrder={builderOrder}
      scoutTab={scoutTab}
      buildersLayout={buildersLayout}
      tab={tab}
      userId={userId}
    />
  );
}
