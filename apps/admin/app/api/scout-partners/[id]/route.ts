import { log } from '@charmverse/core/log';
import { NextResponse } from 'next/server';

import { editScoutPartner } from 'lib/scout-partners/editScoutPartner';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const scoutPartner = await editScoutPartner(id, body);
    return NextResponse.json(scoutPartner);
  } catch (error) {
    log.error('Error updating scout partner', { error });
    return NextResponse.json({ error: 'Failed to update scout partner' }, { status: 500 });
  }
}
