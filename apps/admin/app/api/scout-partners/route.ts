import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { NextResponse } from 'next/server';

import { createScoutPartner } from 'lib/scout-partners/createScoutPartner';

export async function GET() {
  try {
    const scoutPartners = await prisma.scoutPartner.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    log.info('Fetched scout partners', { count: scoutPartners.length, partners: scoutPartners });
    const response = NextResponse.json(scoutPartners);
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    log.error('Error fetching scout partners', { error });
    return NextResponse.json({ error: 'Failed to fetch scout partners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const scoutPartner = await createScoutPartner(body);
    return NextResponse.json(scoutPartner);
  } catch (error) {
    log.error('Error creating scout partner', { error });
    return NextResponse.json({ error: 'Failed to create scout partner' }, { status: 500 });
  }
}
