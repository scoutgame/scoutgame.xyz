import type { SessionData, RequestContext } from './interfaces';

export async function saveSession(ctx: RequestContext, session: SessionData) {
  Object.assign(ctx.session, {
    anonymousUserId: session.anonymousUserId,
    // only override these when they are passed in, since apps use the same cookie currently.
    // This mostly affects local dev env since we dont use cross-domain cookies
    adminId: session.hasOwnProperty('adminId') ? session.adminId : ctx.session.adminId,
    scoutId: session.hasOwnProperty('scoutId') ? session.scoutId : ctx.session.scoutId
  });
  await ctx.session.save();
}
