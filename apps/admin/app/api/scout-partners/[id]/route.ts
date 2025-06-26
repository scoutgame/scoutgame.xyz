import { log } from '@charmverse/core/log';
import { NextResponse } from 'next/server';

import { updateScoutPartner } from 'lib/scout-partners/updateScoutPartner';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const scoutPartner = await updateScoutPartner(params.id, body);
    return NextResponse.json(scoutPartner);
  } catch (error) {
    log.error('Error updating scout partner', { error });
    return NextResponse.json({ error: 'Failed to update scout partner' }, { status: 500 });
  }
}
