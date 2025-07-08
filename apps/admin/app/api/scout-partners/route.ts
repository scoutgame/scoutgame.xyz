import { log } from '@charmverse/core/log';
import type { ScoutPartner } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { NextResponse } from 'next/server';

import { createScoutPartner } from 'lib/scout-partners/createScoutPartner';

export type ScoutPartnerWithRepos = ScoutPartner & { repos: { id: number; owner: string; name: string }[] };

export async function GET() {
  try {
    const scoutPartners: ScoutPartnerWithRepos[] = await prisma.scoutPartner.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        repos: {
          select: {
            id: true,
            owner: true,
            name: true
          }
        }
      }
    });
    log.info('Fetched scout partners', { count: scoutPartners.length, partners: scoutPartners });
    const response = NextResponse.json(scoutPartners as ScoutPartnerWithRepos[]);
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

    // Fetch the created partner with repos
    const createdPartner = await prisma.scoutPartner.findUnique({
      where: { id: scoutPartner.id },
      include: {
        repos: {
          select: {
            id: true,
            owner: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(createdPartner);
  } catch (error) {
    log.error('Error creating scout partner', { error });
    return NextResponse.json({ error: 'Failed to create scout partner' }, { status: 500 });
  }
}
