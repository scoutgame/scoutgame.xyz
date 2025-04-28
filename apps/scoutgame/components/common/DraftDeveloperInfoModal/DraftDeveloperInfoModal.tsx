import { log } from '@charmverse/core/log';
import { getDraftDeveloperInfo } from '@packages/scoutgame/builders/getDraftDeveloperInfo';
import { toast } from 'sonner';
import useSWR from 'swr';

import { DeveloperModal } from '../DeveloperInfoModal/DeveloperInfoModal';

import { DraftDeveloperInfoCard } from './DraftDeveloperInfoCard';
import { DraftDeveloperInfoSkeleton } from './DraftDeveloperInfoSkeleton';

function DeveloperInfoModalComponent({ data: { path }, onClose }: { data: { path: string }; onClose: () => void }) {
  const { data: developer, isLoading } = useSWR(
    path ? `draft-developer-${path}` : null,
    async () => {
      if (!path) {
        return null;
      }

      const _developer = await getDraftDeveloperInfo({ path });
      return _developer;
    },
    {
      onError: (error) => {
        log.error('Error fetching draft developer info', { error, path });
        toast.error('Error fetching developer info');
      }
    }
  );

  if (isLoading || !developer) {
    return <DraftDeveloperInfoSkeleton />;
  }

  return <DraftDeveloperInfoCard onClose={onClose} developer={developer} />;
}

export function DraftDeveloperInfoModal({
  onClose,
  data,
  open
}: {
  onClose: () => void;
  data: { path: string } | null;
  open: boolean;
}) {
  if (!data?.path) {
    return null;
  }

  return (
    <DeveloperModal open={open} onClose={onClose}>
      <DeveloperInfoModalComponent data={data} onClose={onClose} />
    </DeveloperModal>
  );
}
