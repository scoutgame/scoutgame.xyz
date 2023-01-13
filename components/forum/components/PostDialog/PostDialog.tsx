import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import Button from 'components/common/Button';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';

import type { FormInputs } from '../interfaces';
import { PostPage } from '../PostPage/PostPage';

interface Props {
  post?: PostWithVotes | null;
  spaceId: string;
  onClose: () => void;
  open?: boolean;
}

export default function PostDialog({ post, spaceId, onClose, open }: Props) {
  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'post-dialog' });
  const router = useRouter();
  const [formInputs, setFormInputs] = useState<FormInputs>(post ?? { title: '', content: null, contentText: '' });
  const [contentUpdated, setContentUpdated] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // open modal when page is set
  useEffect(() => {
    if (post) {
      popupState.open();
    }
  }, [!!post]);

  // open modal when page is set
  useEffect(() => {
    if (open) {
      popupState.open();
    }
  }, [open]);

  function close() {
    popupState.close();
    onClose();
    setFormInputs({ title: '', content: null, contentText: '' });
    setContentUpdated(false);
    setShowConfirmDialog(false);
  }

  if (!popupState.isOpen) {
    return null;
  }

  return (
    <Dialog
      fullWidth
      toolbar={
        post && (
          <Box display='flex' justifyContent='space-between'>
            <Button
              size='small'
              color='secondary'
              href={`/${router.query.domain}/forum/post/${post.path}`}
              variant='text'
              startIcon={<OpenInFullIcon fontSize='small' />}
            >
              Open as Page
            </Button>
          </Box>
        )
      }
      onClose={() => {
        if (contentUpdated) {
          setShowConfirmDialog(true);
        } else {
          close();
        }
      }}
    >
      <PostPage
        formInputs={formInputs}
        setFormInputs={(_formInputs) => {
          setContentUpdated(true);
          setFormInputs((__formInputs) => ({ ...__formInputs, ..._formInputs }));
        }}
        post={post ?? null}
        spaceId={spaceId}
        onSave={close}
      />
      <ConfirmDeleteModal
        onClose={() => {
          setShowConfirmDialog(false);
        }}
        title='Unsaved changes'
        open={showConfirmDialog}
        buttonText='Discard'
        secondaryButtonText='Go back'
        question='Are you sure you want to close this post? You have unsaved changes'
        onConfirm={close}
      />
    </Dialog>
  );
}
