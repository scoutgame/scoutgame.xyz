'use client';

import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import ShareIcon from '@mui/icons-material/Share';
import { IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { completeQuestAction } from '@packages/scoutgame/quests/completeQuestAction';
import Image from 'next/image';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';

import { useUser } from '../../../providers/UserProvider';

export function ShareProfile({ userPath }: { userPath: string }) {
  const origin = window.location.origin;
  const profileUrl = `${origin}/u/${userPath}`;
  const shareMessage = `Discover my profile on Scout Game: ${profileUrl}`;
  const [isCopied, setIsCopied] = useState(false);
  const { refreshUser, user } = useUser();
  const [anchorElShare, setAnchorElShare] = useState<HTMLElement | null>(null);
  const { execute, isExecuting } = useAction(completeQuestAction, {
    onSuccess: () => {
      refreshUser();
    }
  });

  const handleOpenShareMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElShare(event.currentTarget);
    if (!isExecuting) {
      if (user?.builderStatus === null) {
        execute({ questType: 'share-scout-profile' });
      } else {
        execute({ questType: 'share-builder-profile' });
      }
    }
  };

  const handleCloseShareMenu = () => {
    setAnchorElShare(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setIsCopied(true);
    handleCloseShareMenu();
    setTimeout(() => {
      setIsCopied(false);
    }, 500);
  };

  return (
    <>
      <Tooltip title='Share profile'>
        <IconButton size='small' onClick={handleOpenShareMenu}>
          <ShareIcon fontSize='small' color='primary' />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorElShare}
        open={Boolean(anchorElShare)}
        onClose={handleCloseShareMenu}
        onClick={handleCloseShareMenu}
      >
        <Link href={`https://farcaster.xyz/~/compose?text=${encodeURIComponent(shareMessage)}`} target='_blank'>
          <MenuItem onClick={handleCloseShareMenu}>
            <Image
              src='/images/logos/farcaster.png'
              width={20}
              height={20}
              alt='farcaster icon'
              style={{ marginRight: 8 }}
            />
            <Typography variant='body2'>Farcaster</Typography>
          </MenuItem>
        </Link>
        <Link
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(`${shareMessage}\nI'm playing @scoutgamexyz. Join me! ${user?.referralCode ? `https://scoutgame.xyz/login?ref=${user.referralCode}` : ''}`)}`}
          target='_blank'
        >
          <MenuItem onClick={handleCloseShareMenu}>
            <Image src='/images/logos/x.png' width={20} height={20} alt='x logo' style={{ marginRight: 8 }} />
            <Typography variant='body2'>X</Typography>
          </MenuItem>
        </Link>
        <Link href={`https://t.me/share/url?url=${encodeURIComponent(shareMessage)}`} target='_blank'>
          <MenuItem onClick={handleCloseShareMenu}>
            <Image
              src='/images/logos/telegram.png'
              width={20}
              height={20}
              alt='telegram logo'
              style={{ marginRight: 8 }}
            />
            <Typography variant='body2'>Telegram</Typography>
          </MenuItem>
        </Link>
        <MenuItem onClick={handleCopyLink} disabled={isCopied}>
          <FileCopyOutlinedIcon color='primary' fontSize='small' sx={{ mr: 1 }} />
          <Typography variant='body2'>{isCopied ? 'Copied!' : 'Copy link'}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
