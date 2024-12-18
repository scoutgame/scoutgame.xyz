import { currentSeason, getAllISOWeeksFromSeasonStart } from "@packages/scoutgame/dates";
import { prettyPrint } from "@packages/utils/strings";




async function issueClaims() {
  const season = currentSeason;

  const seasonWeeks = getAllISOWeeksFromSeasonStart({ season, allSeasonWeeks: true });

  for (let i = 0; i < seasonWeeks.length; i++) {
    const week = seasonWeeks[i];

    const claims = await
  }
}

issueClaims();
