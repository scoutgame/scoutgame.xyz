import { log } from '@charmverse/core/log';
import { getDeveloperInfo } from '@packages/scoutgame/builders/getDeveloperInfo';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';

import { DeveloperInfoCard } from '../DeveloperInfoModal/DeveloperInfoCard';
import { DeveloperModal } from '../DeveloperInfoModal/DeveloperInfoModal';
import { DeveloperInfoModalSkeleton } from '../DeveloperInfoModal/DeveloperInfoModalSkeleton';

export function DraftDeveloperModal({
  onClose,
  data,
  open
}: {
  onClose: () => void;
  data: { path: string } | null;
  open: boolean;
}) {
  const { user } = useUser();
  const router = useRouter();

  const { data: developer, isLoading } = useSWR(
    data?.path ? `developer-${data.path}` : null,
    async () => {
      if (!data?.path) {
        return null;
      }

      const _developer = await getDeveloperInfo({ path: data.path, scoutId: user?.id });
      if (!_developer) {
        // If the developer doesn't exist, redirect to the user's profile
        router.push(`/u/${data.path}`);
      }
      return _developer;
    },
    {
      onError: (error) => {
        log.error('Error fetching developer info', { error, path: data?.path });
        toast.error('Error fetching developer info');
      }
    }
  );

  if (isLoading) {
    return (
      <DeveloperModal open={open} onClose={onClose}>
        <DeveloperInfoModalSkeleton />
      </DeveloperModal>
    );
  }

  if (!developer) {
    return null;
  }

  return (
    <DeveloperModal open={open} onClose={onClose}>
      <DeveloperInfoCard onClose={onClose} developer={developer} />
    </DeveloperModal>
  );
}
