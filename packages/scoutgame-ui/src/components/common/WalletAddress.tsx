'use client';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import CheckIcon from '@mui/icons-material/Check';
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
import { useState } from 'react';
import { formatUnits } from 'viem';

// a component that takes a wallet address and returns a shortened version of it with an icon button to copy the full address
export function WalletAddress({
  color,
  address,
  chainId,
  expanded = false
}: {
  color?: string;
  address: string;
  chainId: number;
  expanded?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const blockExplorerUrl = getChainById(chainId)?.blockExplorerUrls[0];

  const handleCopy = (_address: string) => {
    copyToClipboard(_address);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <span>
      <Tooltip title={`View on ${blockExplorerUrl}`}>
        <Box
          component='a'
          href={`${blockExplorerUrl}/address/${address}`}
          target='_blank'
          onClick={(e) => e.stopPropagation()}
          sx={{
            cursor: 'pointer',
            color,
            '&:hover': {
              opacity: 0.8
            }
          }}
        >
          {expanded ? address : shortenHex(address)}
        </Box>
      </Tooltip>
      <Tooltip title={copied ? 'Copied!' : 'Copy address'}>
        <span>
          <IconButton onClick={() => handleCopy(address)} size='small'>
            {copied ? (
              <CheckIcon fontSize='inherit' sx={{ color: 'grey' }} />
            ) : (
              <ContentCopyIcon sx={{ color: 'grey' }} fontSize='inherit' />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </span>
  );
}

function copyToClipboard(address: string) {
  navigator.clipboard.writeText(address);
}
