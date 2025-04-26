'use client';

import { Button, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Dialog } from '../Dialog';

const customTitle = {
  '/claim': 'Please sign in to view your very own Claim page and collect your rewards!',
  '/quests': 'Please sign in to continue your Quest!',
  '/u': 'Please sign in to scout this builder!',
  default: 'Please sign in to continue!'
};

const customSrc = {
  '/claim': '/images/profile/magnifying_glass.png',
  '/quests': '/images/profile/magnifying_glass.png',
  default: '/images/profile/builder-dog.png'
};

export function SignInModalMessage({
  open,
  onClose,
  path = '/'
}: {
  open: boolean;
  onClose: VoidFunction;
  path?: string;
}) {
  const router = useRouter();

  const handleClose = () => {
    router.push(`/login?redirectUrl=${encodeURIComponent(path)}`);
    onClose();
  };

  const pathPrefix = `/${path.split('/')[1]}`;
  const title = customTitle[pathPrefix as keyof typeof customTitle] || customTitle.default;
  const src = customSrc[pathPrefix as keyof typeof customSrc] || customSrc.default;

  return (
    <Dialog
      title='Hi, there! Have we met?'
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 400 } }}
      fullWidth
    >
      <Stack alignItems='center' mt={2} gap={2}>
        <Typography textAlign='center' fontWeight={600}>
          {title}
        </Typography>
        <Image
          src={src}
          alt='Please login'
          width={300}
          height={300}
          sizes='100vw'
          style={{ height: 300, width: 'auto' }}
        />
        <Button data-test='modal-sign-in-button' fullWidth onClick={handleClose}>
          Continue
        </Button>
      </Stack>
    </Dialog>
  );
}
