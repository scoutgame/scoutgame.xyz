import { log } from '@charmverse/core/log';
import { getDraftDeveloperInfo } from '@packages/scoutgame/builders/getDraftDeveloperInfo';
import { toast } from 'sonner';
import useSWR from 'swr';

import { DeveloperModal } from '../DeveloperInfoModal/DeveloperInfoModal';

import { DraftDeveloperInfoCard } from './DraftDeveloperInfoCard';
import { DraftDeveloperInfoSkeleton } from './DraftDeveloperInfoSkeleton';

export function DraftDeveloperInfoModal({
  onClose,
  data,
  open
}: {
  onClose: () => void;
  data: { path: string } | null;
  open: boolean;
}) {
  const { data: developer, isLoading } = useSWR(
    data?.path ? `draft-developer-${data.path}` : null,
    async () => {
      if (!data?.path) {
        return null;
      }

      const _developer = await getDraftDeveloperInfo({ path: data.path });
      return _developer;
    },
    {
      onError: (error) => {
        log.error('Error fetching draft developer info', { error, path: data?.path });
        toast.error('Error fetching developer info');
      }
    }
  );

  if (isLoading) {
    return (
      <DeveloperModal open={open} onClose={onClose}>
        <DraftDeveloperInfoSkeleton />
      </DeveloperModal>
    );
  }

  if (data?.path && !developer) {
    return null;
  }

  return developer ? (
    <DeveloperModal open={open} onClose={onClose}>
      <DraftDeveloperInfoCard onClose={onClose} developer={developer} />
    </DeveloperModal>
  ) : null;
}
