import { log } from '@charmverse/core/log';
import { getCurrentWeek } from '@packages/dates/utils';
import type { Address } from 'viem';

import { getRankedNewScoutsForCurrentWeek, getRankedNewScoutsForPastWeek } from './getNewScouts';

const newScoutsRewards = [60, 50, 40, 35, 30, 25, 20, 15, 15, 10];

type NewScoutReward = {
  address: Address;
  opAmount: number;
};

export async function getNewScoutRewards({ week }: { week: string }): Promise<NewScoutReward[]> {
  const isCurrentWeek = week === getCurrentWeek();
  const newScouts = isCurrentWeek
    ? await getRankedNewScoutsForCurrentWeek().catch((error) => {
        log.error('Error getting ranked new scouts for current week', { error, week });
        return [];
      })
    : await getRankedNewScoutsForPastWeek({ week });
  const top10Scouts = newScouts.slice(0, 10);
  const rewards = top10Scouts.map((scout, index) => ({
    address: scout.address as Address,
    opAmount: newScoutsRewards[index]
  }));
  return rewards;
}
