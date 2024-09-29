'use client';

import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderInfo } from 'lib/builders/interfaces';

export const dynamic = 'force-dynamic';

export async function BuildersGalleryContainer({
  builders,
  showHotIcon
}: {
  builders: BuilderInfo[];
  showHotIcon: boolean;
}) {
  const isDesktop = useMdScreen();

  return (
    <BuildersGallery builders={builders} showHotIcon={showHotIcon} size={isDesktop ? 'medium' : 'small'} columns={5} />
  );
}
