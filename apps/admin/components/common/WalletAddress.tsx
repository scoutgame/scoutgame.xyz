'use client';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  Card,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton
} from '@mui/material';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { shortenHex } from '@packages/utils/strings';
import { formatUnits } from 'viem';

// a function that takes a wallet address and returns a shortened version of it with an icon button to copy the full address
export function WalletAddress({ address }: { address: string }) {
  return (
    <span>
      {shortenHex(address)}
      <IconButton onClick={() => copyToClipboard(address)} size='small' color='secondary'>
        <ContentCopyIcon fontSize='inherit' />
      </IconButton>
    </span>
  );
}

function copyToClipboard(address: string) {
  navigator.clipboard.writeText(address);
}
