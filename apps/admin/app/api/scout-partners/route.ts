import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { NextResponse } from 'next/server';

import { createScoutPartner } from 'lib/scout-partners/createScoutPartner';
import { editScoutPartner } from 'lib/scout-partners/editScoutPartner';
import type { ScoutPartnerWithRepos } from 'lib/scout-partners/getScoutPartners';
import { getScoutPartners } from 'lib/scout-partners/getScoutPartners';

export async function GET() {
  try {
    const scoutPartners = await getScoutPartners();
    const response = NextResponse.json(scoutPartners);
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
    const createdPartner: ScoutPartnerWithRepos | null = await prisma.scoutPartner.findUnique({
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

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required as query parameter' }, { status: 400 });
    }

    await editScoutPartner(id, body);

    // Fetch the updated partner with repos
    const updatedPartner: ScoutPartnerWithRepos | null = await prisma.scoutPartner.findUnique({
      where: { id },
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

    if (!updatedPartner) {
      return NextResponse.json({ error: 'Scout partner not found' }, { status: 404 });
    }

    return NextResponse.json(updatedPartner);
  } catch (error) {
    log.error('Error updating scout partner', { error });
    return NextResponse.json({ error: 'Failed to update scout partner' }, { status: 500 });
  }
}
