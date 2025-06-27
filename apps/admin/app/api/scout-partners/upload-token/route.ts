import { log } from '@charmverse/core/log';
import { uploadToken } from '@packages/aws/uploadToken';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { filename } = await request.json();

    // We use a fixed userId for scout partners since they are managed by admins
    const tokenData = await uploadToken({ filename, userId: 'scout-partners' });

    return NextResponse.json(tokenData);
  } catch (error) {
    log.error('Error generating upload token', { error });
    return NextResponse.json({ error: 'Failed to generate upload token' }, { status: 500 });
  }
}
