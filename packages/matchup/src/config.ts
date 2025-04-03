import { whiteListedUserIds, isProdEnv } from '@packages/utils/constants';

// Fee in points that scouts pay to register for a matchup
export const MATCHUP_REGISTRATION_FEE = 50;
// Portion of registration fee (80%) that goes into the prize pool for winners
export const MATCHUP_REGISTRATION_POOL = 40;
// Fixed OP token prize awarded to matchup winners
export const MATCHUP_OP_PRIZE = 100;
// The day of the week when matchup registration is open
export const REGISTRATION_DAY_OF_WEEK = 4; // day of the week to register for the matchup
// Maximum number of scouts a player can select for their matchup team
export const MAX_SELECTIONS = 5;
// Maximum total credits a player can spend when selecting scouts for their team
export const MAX_CREDITS = 35;

export const enableMatchupsFeatureFlag = (userId?: string) =>
  !isProdEnv || (userId && whiteListedUserIds.includes(userId));
