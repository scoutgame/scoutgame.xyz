import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { NextResponse } from 'next/server';

import { editScoutPartner } from 'lib/scout-partners/editScoutPartner';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await editScoutPartner(id, body);

    // Fetch the updated partner with repos
    const updatedPartner = await prisma.scoutPartner.findUnique({
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

    return NextResponse.json(updatedPartner);
  } catch (error) {
    log.error('Error updating scout partner', { error });
    return NextResponse.json({ error: 'Failed to update scout partner' }, { status: 500 });
  }
}
