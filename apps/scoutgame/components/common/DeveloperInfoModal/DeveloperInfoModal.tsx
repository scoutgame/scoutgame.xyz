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

export function DeveloperInfoModal({
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
        <DeveloperInfoSkeleton />
      </DeveloperModal>
    );
  }

  if (data?.path && !developer) {
    return null;
  }

  return developer ? (
    <DeveloperModal open={open} onClose={onClose}>
      <DeveloperInfoCard onClose={onClose} developer={developer} />
    </DeveloperModal>
  ) : null;
}
