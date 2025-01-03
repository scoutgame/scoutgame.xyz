import { getDailyClaims } from '@packages/scoutgame/claims/getDailyClaims';
import { getSession } from '@packages/scoutgame/session/getSession';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return NextResponse.json(null);
  }

  const claims = await getDailyClaims(scoutId);

  return NextResponse.json(claims);
}
