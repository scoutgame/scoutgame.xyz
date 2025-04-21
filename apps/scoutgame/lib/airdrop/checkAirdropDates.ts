import env from '@beam-australia/react-env';

export function isAirdropLive() {
  const isDraftLive = env('IS_DRAFT_LIVE') || process.env.REACT_APP_IS_DRAFT_LIVE;
  return isDraftLive === 'true';
}
