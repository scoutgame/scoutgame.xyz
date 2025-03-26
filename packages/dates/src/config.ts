export type ISOWeek = string; // isoweek, e.g. '2024-W01'

// Season start MUST be on a Monday, when isoweek begins

export type SeasonConfig = {
  title: string;
  start: ISOWeek;
  preseason?: boolean;
  weeksPerSeason: number;
};

// the end of each season is the start of the next season
export const seasons = [
  // dev season
  {
    start: '2024-W38',
    title: 'Dev Season',
    weeksPerSeason: 13
  },
  // pre-release season
  {
    start: '2024-W40',
    title: 'Pre Season',
    weeksPerSeason: 13
  },
  // Preseason 1
  {
    start: '2024-W41',
    title: 'Season 1',
    weeksPerSeason: 13,
    preseason: true
  },
  // Preseason 2
  {
    start: '2025-W02',
    title: 'Season 2',
    weeksPerSeason: 15, // extended season
    preseason: true
  },
  // Season 1
  {
    // April 28th 2025
    start: '2025-W18',
    title: 'Season 1',
    weeksPerSeason: 13
  }
] satisfies SeasonConfig[];

export const seasonStarts = seasons.map((s) => s.start);

export type Season = (typeof seasons)[number]['start'];

export const streakWindow = 7 * 24 * 60 * 60 * 1000;
