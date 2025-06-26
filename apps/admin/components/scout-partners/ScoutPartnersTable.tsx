'use client';

import type { ScoutPartner } from '@charmverse/core/prisma';
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
  Typography
} from '@mui/material';
import Image from 'next/image';
import React, { useState, useMemo } from 'react';

type SortField = 'id' | 'name' | 'tokenAmountPerPullRequest' | 'tokenSymbol' | 'tokenChain';
type SortOrder = 'asc' | 'desc';

export function ScoutPartnersTable({ partners, isLoading }: { partners?: ScoutPartner[]; isLoading: boolean }) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sortField === 'id'}
                direction={sortField === 'id' ? sortOrder : 'asc'}
                onClick={() => handleSort('id')}
              >
                ID
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'name'}
                direction={sortField === 'name' ? sortOrder : 'asc'}
                onClick={() => handleSort('name')}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell>Icon</TableCell>
            <TableCell>Banner</TableCell>
            <TableCell>Info Page</TableCell>
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
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedPartners.map((partner) => (
            <TableRow key={partner.id}>
              <TableCell>{partner.id}</TableCell>
              <TableCell>{partner.name}</TableCell>
              <TableCell>
                <Link href={partner.icon} target='_blank'>
                  <Image src={partner.icon} alt={`${partner.name} icon`} width={30} height={30} />
                </Link>
              </TableCell>
              <TableCell>
                <Link href={partner.bannerImage} target='_blank'>
                  <Image src={partner.bannerImage} alt={`${partner.name} banner`} width={60} height={30} />
                </Link>
              </TableCell>
              <TableCell>
                <Link href={partner.infoPageImage} target='_blank'>
                  <Image src={partner.infoPageImage} alt={`${partner.name} info page`} width={60} height={30} />
                </Link>
              </TableCell>
              <TableCell>{partner.tokenAmountPerPullRequest || '-'}</TableCell>
              <TableCell>{partner.tokenChain || '-'}</TableCell>
              <TableCell>
                {partner.tokenAddress ? (
                  <Link href={`https://etherscan.io/address/${partner.tokenAddress}`} target='_blank'>
                    {partner.tokenAddress.slice(0, 6)}...{partner.tokenAddress.slice(-4)}
                  </Link>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{partner.tokenSymbol || '-'}</TableCell>
              <TableCell>
                {partner.tokenImage ? (
                  <Link href={partner.tokenImage} target='_blank'>
                    <Image src={partner.tokenImage} alt={`${partner.name} token`} width={20} height={20} />
                  </Link>
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
