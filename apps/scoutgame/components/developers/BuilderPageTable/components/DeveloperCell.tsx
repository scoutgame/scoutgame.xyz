'use client';

import { Stack } from '@mui/material';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import Link from 'next/link';

import { useGlobalModal } from 'components/common/ModalProvider';
import { TableCellText } from 'components/common/TableCellText';

export function DeveloperCell({ displayName, avatar, path }: { displayName: string; avatar: string; path: string }) {
  const { openModal } = useGlobalModal();

  return (
    <Link href={`/u/${path}`} passHref onClick={(e) => e.preventDefault()}>
      <Stack
        onClick={() => openModal('developerInfo', { path })}
        alignItems='center'
        flexDirection='row'
        gap={1}
        sx={{ cursor: 'pointer' }}
      >
        <Avatar src={avatar} name={displayName} size='small' />
        <TableCellText noWrap>{displayName}</TableCellText>
      </Stack>
    </Link>
  );
}
