import { log } from "@charmverse/core/log";
import { currentSeason, getAllISOWeeksFromSeasonStart, getCurrentWeek } from "@packages/scoutgame/dates";
import { scoutProtocolBuilderNftContractAddress, scoutProtocolChainId } from "@packages/scoutgame/protocol/constants";
import { calculateWeeklyClaims, generateWeeklyClaims } from "@packages/scoutgame/protocol/generateWeeklyClaims";
import { resolveTokenOwnership } from "@packages/scoutgame/protocol/resolveTokenOwnership";
import { validateIsNotProductionDatabase } from "./utils";
import { prettyPrint } from "@packages/utils/strings";

validateIsNotProductionDatabase()


async function issueClaims() {

  const seasonWeeks = getAllISOWeeksFromSeasonStart({ season: currentSeason, allSeasonWeeks: true });

  // The ownership will be empty for previous weeks, so we can use current ownership for past data simulations.
  const ownership = await resolveTokenOwnership({ week: getCurrentWeek(), chainId: scoutProtocolChainId, contractAddress: scoutProtocolBuilderNftContractAddress() });

  // For testing purposes, we only want to issue claims for one week
  // for (let i = 0; i < 1; i++) {
  for (let i = 0; i < seasonWeeks.length; i++) {

    try {
      const week = seasonWeeks[i];

      log.info(`Calculating claims for week ${week} ${i+1} of ${seasonWeeks.length}`)
  
      const weeklyClaimsCalculated = await calculateWeeklyClaims({
        week,
        tokenBalances: ownership
      });
  
      await generateWeeklyClaims({
        week,
        weeklyClaimsCalculated
      })
  
      log.info(`Issued claims for week ${week}`)

    } catch (error) {
      log.error(`Error calculating claims for week ${seasonWeeks[i]}`, error)
    }
  }
}

issueClaims();
