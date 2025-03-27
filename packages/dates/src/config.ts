import type { Address } from 'viem';

export type ISOWeek = string; // isoweek, e.g. '2024-W01'

// Season start MUST be on a Monday, when isoweek begins

export type SeasonConfig = {
  title: string;
  start: ISOWeek;
  preseason?: boolean;
  starterNftAddress: Address;
  defaultNftAddress: Address;
  weeksPerSeason: number;
};

// the end of each season is the start of the next season
export const seasons = [
  // dev season
  {
    start: '2024-W38',
    title: 'Dev Season',
    starterNftAddress: '0x0000000000000000000000000000000000000000',
    defaultNftAddress: '0x0000000000000000000000000000000000000000',
    weeksPerSeason: 13
  },
  // pre-release season
  {
    start: '2024-W40',
    title: 'Pre Season',
    starterNftAddress: '0x0000000000000000000000000000000000000000',
    defaultNftAddress: '0x0000000000000000000000000000000000000000',
    weeksPerSeason: 13
  },
  // Preseason 1
  {
    start: '2024-W41',
    title: 'Season 1',
    starterNftAddress: '0xd0b718589a51b07d05f03b8150e830d3627da972',
    defaultNftAddress: '0x743ec903FE6D05E73b19a6DB807271bb66100e83',
    weeksPerSeason: 13,
    preseason: true
  },
  // Preseason 2
  {
    start: '2025-W02',
    starterNftAddress: '0xcbbdb9e378a4c33b1b202392b10e1be5e01a97f8',
    defaultNftAddress: '0x6fbbd55274169d67f6fe9c868327003c90143440',
    title: 'Season 2',
    weeksPerSeason: 15, // extended season
    preseason: true
  },
  // Season 1
  {
    start: '2025-W18', // April 28th 2025
    title: 'Season 1',
    starterNftAddress: '0x0000000000000000000000000000000000000000',
    defaultNftAddress: '0x0000000000000000000000000000000000000000',
    weeksPerSeason: 13
  }
] satisfies SeasonConfig[];

export const seasonStarts = seasons.map((s) => s.start);

export type Season = (typeof seasons)[number]['start'];

export const streakWindow = 7 * 24 * 60 * 60 * 1000;
