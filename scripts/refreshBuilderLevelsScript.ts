import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { refreshBuilderLevels } from '@packages/scoutgame/points/refreshBuilderLevels';
import { getAllISOWeeksFromSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { calculateDeveloperLevels } from '@packages/scoutgame/points/calculateBuilderLevel';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Create the output directory if it doesn't exist

// Get current directory in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'output');

async function script() {
  const season = getCurrentSeasonStart();
  const weeks = getAllISOWeeksFromSeasonStart({ season });
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved'
    }
  });
  // Create or append to the TSV file
  const outputFile = path.join(outputDir, `chris_levels_${season}.tsv`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  // Add headers if file doesn't exist
  if (!fs.existsSync(outputFile)) {
    fs.writeFileSync(
      outputFile,
      'Builder Name\tSeason Week\tTotal Points\tLevel\tCentile\tFirst Active Week\tAvg Gems Per Week\n'
    );
  }

  for (const week of weeks) {
    const levels = await calculateDeveloperLevels({
      season,
      week
    });
    for (const level of levels) {
      const builder = builders.find((b) => b.id === level.builderId);
      if (builder?.path !== 'ckurdziel.eth') {
        continue;
      }
      // Write to TSV file with builder details

      // Append builder data
      fs.appendFileSync(
        outputFile,
        `${builder?.displayName || 'Unknown'}\t${week}\t${level.totalPoints}\t${level.level}\t${level.centile}\t${level.firstActiveWeek}\t${level.averageGemsPerWeek}\n`
      );

      // console.log(`Added ${builder?.displayName || 'Unknown'} (Level ${level.level}) to ${outputFile}`);
    }
    console.log(`Added ${levels.length} levels for week ${week}`);
  }

  // const levelZeroBuilders = await prisma.userSeasonStats.updateMany({
  //   where: {
  //     season: getCurrentSeasonStart(),
  //     userId: {
  //       notIn: levels.map((level) => level.builderId)
  //     }
  //   },
  //   data: {
  //     level: 0
  //   }
  // });
}

script();
