import { isProdEnv } from '@packages/utils/constants';
import type { Address } from 'viem';

export type ISOWeek = string; // isoweek, e.g. '2024-W01'

// Season start MUST be on a Monday, when isoweek begins

export type SeasonConfig = {
  title: string;
  id: string;
  start: ISOWeek;
  preseason?: boolean;
  starterNftAddress: Address;
  defaultNftAddress: Address;
  weeksPerSeason: number;
  draft?: boolean;
};

// the end of each season is the start of the next season
export const seasons: SeasonConfig[] = [
  // dev season
  {
    start: '2024-W38',
    title: 'Dev Season',
    starterNftAddress: '0x0000000000000000000000000000000000000000',
    defaultNftAddress: '0x0000000000000000000000000000000000000000',
    weeksPerSeason: 13,
    preseason: true,
    id: 'dev-season'
  },
  // pre-release season
  {
    start: '2024-W40',
    title: 'Pre Season',
    starterNftAddress: '0x0000000000000000000000000000000000000000',
    defaultNftAddress: '0x0000000000000000000000000000000000000000',
    weeksPerSeason: 13,
    preseason: true,
    id: 'pre-season-0'
  },
  // Preseason 1
  {
    start: '2024-W41',
    title: 'Season 1',
    starterNftAddress: '0xd0b718589a51b07d05f03b8150e830d3627da972',
    defaultNftAddress: '0x743ec903FE6D05E73b19a6DB807271bb66100e83',
    weeksPerSeason: 13,
    preseason: true,
    id: 'pre-season-1'
  },
  // Preseason 2
  {
    start: '2025-W02',
    starterNftAddress: '0xcbbdb9e378a4c33b1b202392b10e1be5e01a97f8',
    defaultNftAddress: '0x6fbbd55274169d67f6fe9c868327003c90143440',
    title: 'Season 2',
    weeksPerSeason: 15, // extended season
    preseason: true,
    id: 'pre-season-2'
  },
  ...(isProdEnv
    ? [
        {
          start: '2025-W17',
          title: 'Draft Season',
          starterNftAddress: '0x0000000000000000000000000000000000000000' as Address,
          defaultNftAddress: '0x0000000000000000000000000000000000000000' as Address,
          weeksPerSeason: 1,
          draft: true,
          id: 'draft-season'
        },
        // Season 1
        {
          start: '2025-W18', // April 28th 2025
          title: 'Season 1',
          starterNftAddress: '0x0000000000000000000000000000000000000000' as Address,
          defaultNftAddress: '0x0000000000000000000000000000000000000000' as Address,
          weeksPerSeason: 13,
          id: 'season-1'
        }
      ]
    : [
        {
          start: '2025-W17', // April 21th 2025
          title: 'Season 1',
          starterNftAddress: '0x00Cda67D2254D6b63b6cd21701FCd8862060e7cd' as Address,
          defaultNftAddress: '0x956Fe293b683599ef2Aad565c107d8B844B148B6' as Address,
          weeksPerSeason: 13,
          id: 'season-1'
        }
      ])
] satisfies SeasonConfig[];

export const seasonStarts = seasons.map((s) => s.start);

export type Season = (typeof seasons)[number]['start'];

export const streakWindow = 7 * 24 * 60 * 60 * 1000;
