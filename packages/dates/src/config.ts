export type ISOWeek = string; // isoweek, e.g. '2024-W01'

// Season start MUST be on a Monday, when isoweek begins

export const weeksPerSeason = 13;

export type SeasonConfig = {
  title: string;
  start: ISOWeek;
  preseason?: boolean;
};

// the end of each season is the start of the next season
export const seasons = [
  // dev season
  {
    start: '2024-W38',
    title: 'Dev Season'
  },
  // pre-release season
  {
    start: '2024-W40',
    title: 'Pre Season'
  },
  // Preseason 1
  {
    start: '2024-W41',
    title: 'Season 1',
    preseason: true
  },
  // Preseason 2
  {
    start: '2025-W02',
    title: 'Season 2',
    preseason: true
  },
  // Season 1
  {
    // April 28th 2025
    start: '2025-W10',
    title: 'Season 1'
  }
] satisfies SeasonConfig[];

export const seasonStarts = seasons.map((s) => s.start);

export type Season = (typeof seasons)[number]['start'];

export const streakWindow = 7 * 24 * 60 * 60 * 1000;
