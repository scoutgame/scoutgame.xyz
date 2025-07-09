'use client';

import type { ScoutPartnerStatus } from '@charmverse/core/prisma';
import EditIcon from '@mui/icons-material/Edit';
import {
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  TableSortLabel,
  CircularProgress,
  Box,
  Typography,
  Chip,
  IconButton,
  Modal
} from '@mui/material';
import { getChainById } from '@packages/blockchain/chains';
import Image from 'next/image';
import React, { useState, useMemo } from 'react';

import type { ScoutPartnerWithRepos } from 'lib/scout-partners/getScoutPartners';

import { chainOptions } from './ChainSelector';
import { EditScoutPartnerForm } from './EditScoutPartnerForm';

type SortField = 'id' | 'name' | 'tokenAmountPerPullRequest' | 'tokenSymbol' | 'tokenChain' | 'status';
type SortOrder = 'asc' | 'desc';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflow: 'auto'
};

const statusColors: Record<ScoutPartnerStatus, 'success' | 'warning' | 'error'> = {
  active: 'success',
  paused: 'warning',
  completed: 'error'
};

const statusLabels: Record<ScoutPartnerStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed'
};

type Props = {
  partners?: ScoutPartnerWithRepos[];
  isLoading: boolean;
  onPartnerUpdate: (partner: ScoutPartnerWithRepos) => void;
};

// Add this component for centered image display
function CenteredImage({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Image src={src} alt={alt} width={width} height={height} style={{ objectFit: 'contain' }} />
    </Box>
  );
}

export function ScoutPartnersTable({ partners, isLoading, onPartnerUpdate }: Props) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [editingPartner, setEditingPartner] = useState<ScoutPartnerWithRepos | null>(null);

  const sortedPartners = useMemo(() => {
    if (!partners) return [];
    return [...partners].sort((a, b) => {
      if (!a[sortField]) return sortOrder === 'asc' ? -1 : 1;
      if (!b[sortField]) return sortOrder === 'asc' ? 1 : -1;
      if (a[sortField]! < b[sortField]!) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortField]! > b[sortField]!) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [partners, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!partners?.length) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'background.paper' }}>
        <Stack spacing={2} alignItems='center'>
          <Typography variant='h6' color='textSecondary'>
            No Scout Partners Found
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Create your first scout partner by clicking the "Create Partner" button above.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'name'}
                  direction={sortField === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'status'}
                  direction={sortField === 'status' ? sortOrder : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>Icon</TableCell>
              <TableCell>Developer Page Banner</TableCell>
              <TableCell>Info Page Banner</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'tokenAmountPerPullRequest'}
                  direction={sortField === 'tokenAmountPerPullRequest' ? sortOrder : 'asc'}
                  onClick={() => handleSort('tokenAmountPerPullRequest')}
                >
                  Token Amount/PR
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'tokenChain'}
                  direction={sortField === 'tokenChain' ? sortOrder : 'asc'}
                  onClick={() => handleSort('tokenChain')}
                >
                  Chain
                </TableSortLabel>
              </TableCell>
              <TableCell>Token Address</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'tokenSymbol'}
                  direction={sortField === 'tokenSymbol' ? sortOrder : 'asc'}
                  onClick={() => handleSort('tokenSymbol')}
                >
                  Symbol
                </TableSortLabel>
              </TableCell>
              <TableCell>Token Image</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPartners.map((partner) => {
              const chain = partner.tokenChain ? getChainById(Number(partner.tokenChain)) : undefined;
              const chainOption = chain ? chainOptions.find((c) => c.id === Number(partner.tokenChain)) : undefined;
              return (
                <TableRow key={partner.id}>
                  <TableCell>{partner.name}</TableCell>
                  <TableCell>
                    <Chip
                      variant='outlined'
                      label={statusLabels[partner.status]}
                      color={statusColors[partner.status]}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={partner.icon} target='_blank' sx={{ display: 'block', textAlign: 'center' }}>
                      <CenteredImage src={partner.icon} alt={`${partner.name} icon`} width={30} height={30} />
                    </Link>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    {partner.bannerImage ? (
                      <Link href={partner.bannerImage} target='_blank' sx={{ display: 'block', textAlign: 'center' }}>
                        <CenteredImage
                          src={partner.bannerImage}
                          alt={`${partner.name} banner`}
                          width={60}
                          height={30}
                        />
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    {partner.infoPageImage ? (
                      <Link href={partner.infoPageImage} target='_blank' sx={{ display: 'block', textAlign: 'center' }}>
                        <CenteredImage
                          src={partner.infoPageImage}
                          alt={`${partner.name} info page`}
                          width={60}
                          height={30}
                        />
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{partner.tokenAmountPerPullRequest || '-'}</TableCell>
                  <TableCell>
                    {chain ? (
                      <Stack direction='row' spacing={1} alignItems='center'>
                        {chainOption?.icon && (
                          <CenteredImage src={chainOption.icon} alt={chain.chainName} width={20} height={20} />
                        )}
                        <Typography variant='body2'>{chain.chainName}</Typography>
                      </Stack>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {partner.tokenAddress && chain ? (
                      <Link href={`${chain.blockExplorerUrls[0]}/address/${partner.tokenAddress}`} target='_blank'>
                        {partner.tokenAddress.slice(0, 6)}...{partner.tokenAddress.slice(-4)}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{partner.tokenSymbol || '-'}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    {partner.tokenImage ? (
                      <Link href={partner.tokenImage} target='_blank' sx={{ display: 'block', textAlign: 'center' }}>
                        <CenteredImage src={partner.tokenImage} alt={`${partner.name} token`} width={20} height={20} />
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => setEditingPartner(partner)} size='small'>
                      <EditIcon fontSize='small' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={!!editingPartner} onClose={() => setEditingPartner(null)}>
        <Box sx={modalStyle}>
          {editingPartner && (
            <EditScoutPartnerForm
              partner={editingPartner}
              onClose={() => setEditingPartner(null)}
              onSuccess={(updatedPartner) => {
                onPartnerUpdate(updatedPartner);
                setEditingPartner(null);
              }}
            />
          )}
        </Box>
      </Modal>
    </>
  );
}
