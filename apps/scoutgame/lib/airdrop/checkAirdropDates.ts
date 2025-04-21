import env from '@beam-australia/react-env';
import { whitelistedScoutIds } from '@packages/scoutgame/drafts/checkDraftDates';

export function isAirdropLive(userId?: string) {
  const isDraftLive = env('IS_DRAFT_LIVE') || process.env.REACT_APP_IS_DRAFT_LIVE;
  return (userId && whitelistedScoutIds.includes(userId)) || isDraftLive === 'true';
}
