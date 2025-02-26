'use client';

import type { MenuItemProps } from '@mui/material';
import { MenuItem } from '@mui/material';
import { useState } from 'react';

import { AddRepoModal } from 'components/repos/components/AddRepoButton/AddRepoModal';

export function AddRepoMenuItem({
  partner,
  onComplete,
  children,
  ...props
}: Omit<MenuItemProps, 'onClick'> & { partner: string; onComplete: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <MenuItem {...props} onClick={() => setIsModalOpen(true)}>
        {children}
      </MenuItem>
      <AddRepoModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          onComplete();
        }}
        partner={partner}
        onAdd={onComplete}
      />
    </>
  );
}
