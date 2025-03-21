import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getSession } from '@packages/nextjs/session/getSession';
import { checkWalletSanctionStatus } from '@packages/scoutgame/wallets/checkWalletSanctionStatus';
import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

export async function GET(request: Request) {
  const session = await getSession();
  const scoutId = session?.scoutId;

  if (!scoutId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  if (!address) {
    return new Response('address is required', { status: 400 });
  }
  if (!isAddress(address)) {
    return new Response('Invalid address', { status: 400 });
  }

  await prisma.scoutWallet.findUniqueOrThrow({
    where: {
      address: address.toLowerCase()
    }
  });
  const isSanctioned = await checkWalletSanctionStatus(address);
  if (isSanctioned) {
    log.warn('Wallet address is sanctioned', { address });
    return new Response('Wallet address is sanctioned. Try a different wallet', { status: 400 });
  }

  return NextResponse.json({ success: true });
}
