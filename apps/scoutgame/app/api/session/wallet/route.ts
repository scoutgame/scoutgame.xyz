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

  const isSanctioned = await checkWalletSanctionStatus(address);
  if (isSanctioned) {
    return new Response('Wallet address is sanctioned', { status: 400 });
  }

  const existingUser = await prisma.scoutWallet.findUnique({
    where: {
      address: address.toLowerCase()
    }
  });
  if (existingUser) {
    if (existingUser.scoutId !== scoutId) {
      log.warn('Wallet address already in use by another user', {
        address,
        userId: scoutId,
        existingUserId: existingUser.scoutId
      });
      return new Response(`Address ${address} is already in use`, {
        status: 400
      });
    }
  } else {
    const wallets = await prisma.scoutWallet.findMany({ where: { scoutId } });
    const primary = wallets.length === 0; // The first scout wallet should be set to primary

    await prisma.scoutWallet.create({
      data: {
        address: address.toLowerCase(),
        scoutId,
        primary
      }
    });
    log.info('Added wallet address to user', { address, userId: scoutId, primary });
  }
  return NextResponse.json({ success: true });
}
