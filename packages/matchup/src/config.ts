import env from '@beam-australia/react-env';
import { getCurrentWeek } from '@packages/dates/utils';

// Fee in DEV that scouts pay to register for a matchup
export const MATCHUP_REGISTRATION_FEE = 250;
// Portion of registration fee (80%) that goes into the prize pool for winners
export const MATCHUP_REGISTRATION_POOL = Math.floor(MATCHUP_REGISTRATION_FEE * 0.8);
// Fixed OP token prize awarded to matchup winners
export const MATCHUP_OP_PRIZE = 100;
// The day of the week when matchup registration is open
export const REGISTRATION_DAY_OF_WEEK = 1; // day of the week to register for the matchup
// Maximum number of scouts a player can select for their matchup team
export const MAX_SELECTIONS = 5;
// Maximum total credits a player can spend when selecting scouts for their team
export const MAX_CREDITS = 35;

export const MATCHUP_WALLET_ADDRESS = env('REWARDS_WALLET_ADDRESS') || process.env.REACT_APP_REWARDS_WALLET_ADDRESS;

export const enableMatchupsFeatureFlag = () => getCurrentWeek() <= '2025-W25';
