import { log } from '@charmverse/core/log';
import { styled } from '@mui/material';
import { getDeveloperInfo } from '@packages/scoutgame/builders/getDeveloperInfo';
import { Dialog } from '@packages/scoutgame-ui/components/common/Dialog';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';

import { DeveloperInfoCard } from './DeveloperInfoCard';
import { DeveloperInfoSkeleton } from './DeveloperInfoSkeleton';

export const DeveloperModal = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(1)
  },
  '& .MuiDialog-paper': {
    [theme.breakpoints.down('md')]: {
      minWidth: '100%'
    },
    [theme.breakpoints.up('md')]: {
      minWidth: '600px'
    },
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1)
  }
}));

function DeveloperInfoModalComponent({ data: { path }, onClose }: { data: { path: string }; onClose: () => void }) {
  const { user } = useUser();
  const router = useRouter();
  const { data: developer, isLoading } = useSWR(
    path ? `developer-${path}` : null,
    async () => {
      if (!path) {
        return null;
      }

      const _developer = await getDeveloperInfo({ path, scoutId: user?.id });
      if (!_developer) {
        // If the developer doesn't exist, redirect to the user's profile
        router.push(`/u/${path}`);
      }
      return _developer;
    },
    {
      onError: (error) => {
        log.error('Error fetching developer info', { error, path });
        toast.error('Error fetching developer info');
      }
    }
  );

  if (isLoading || !developer) {
    return <DeveloperInfoSkeleton />;
  }
  return <DeveloperInfoCard onClose={onClose} developer={developer} />;
}

export function DeveloperInfoModal({
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
