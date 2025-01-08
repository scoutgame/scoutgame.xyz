import { DateTime } from 'luxon';
import { updateBuilderDailyGemsAverage } from '@packages/scoutgame/gems/updateBuilderDailyGemsAverage';

async function backfillBuilderDailyGemsAverage() {
  const backfillDays = 14;
  const today = DateTime.now().setZone('utc').startOf('day');

  for (let i = 0; i < backfillDays; i++) {
    try {
      const date = today.minus({ day: i });
      await updateBuilderDailyGemsAverage(date);
    } catch (error) {
      console.error(`Error backfilling builder daily gems average for day ${i}: ${error}`);
    }
  }
}

backfillBuilderDailyGemsAverage();