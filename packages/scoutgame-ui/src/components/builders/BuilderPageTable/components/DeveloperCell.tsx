'use client';

import { Stack } from '@mui/material';

import { useDeveloperInfoModal } from '../../../../hooks/useDeveloperInfoModal';
import { Avatar } from '../../../common/Avatar';

import { TableCellText } from './TableCellText';

export function DeveloperCell({ displayName, avatar, path }: { displayName: string; avatar: string; path: string }) {
  const { openDeveloperInfoModal, isLoading } = useDeveloperInfoModal();

  return (
    <Stack
      onClick={() => !isLoading && openDeveloperInfoModal(path)}
      alignItems='center'
      flexDirection='row'
      gap={1}
      sx={{ cursor: !isLoading ? 'pointer' : 'default' }}
    >
      <Avatar src={avatar} name={displayName} size='small' />
      <TableCellText noWrap>{displayName}</TableCellText>
    </Stack>
  );
}
