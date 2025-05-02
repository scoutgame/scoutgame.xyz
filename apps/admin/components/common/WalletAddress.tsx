'use client';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import {
  Box,
  Card,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Tooltip,
  TableBody,
  IconButton
} from '@mui/material';
import { getChainById } from '@packages/blockchain/chains';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { shortenHex } from '@packages/utils/strings';
import { formatUnits } from 'viem';
import { base } from 'viem/chains';
// a function that takes a wallet address and returns a shortened version of it with an icon button to copy the full address
export function WalletAddress({ address, chainId = base.id }: { address: string; chainId?: number }) {
  const blockExplorerUrl = getChainById(chainId)?.blockExplorerUrls[0];
  return (
    <span>
      <Tooltip title={`View on ${blockExplorerUrl}`}>
        <Box
          component='a'
          href={`${blockExplorerUrl}/address/${address}`}
          target='_blank'
          onClick={() => copyToClipboard(address)}
          sx={{
            cursor: 'pointer',
            textDecoration: 'underline',
            color: 'secondary.main',
            '&:hover': {
              opacity: 0.8
            }
          }}
        >
          {shortenHex(address)}
        </Box>
      </Tooltip>
      <Tooltip title='Copy address'>
        <span>
          <IconButton onClick={() => copyToClipboard(address)} size='small' color='secondary'>
            <ContentCopyIcon fontSize='inherit' />
          </IconButton>
        </span>
      </Tooltip>
    </span>
  );
}

function copyToClipboard(address: string) {
  navigator.clipboard.writeText(address);
}
