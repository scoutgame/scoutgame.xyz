import type { GemsReceipt } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

export type BuilderEventWithGemsReceipt = {
  createdAt: Date;
  gemsReceipt?: Pick<GemsReceipt, 'value'>;
};

export type DailyGems = {
  date: string;
  gemsCount: number;
};

export function mapGemReceiptsToLast14Days({
  events,
  currentDate
}: {
  events: BuilderEventWithGemsReceipt[];
  currentDate: DateTime;
}): DailyGems[] {
  const dayGemsRecord: Record<string, number> = {};
  events.forEach((event) => {
    const formattedDate = DateTime.fromJSDate(event.createdAt).toFormat('yyyy-MM-dd');
    dayGemsRecord[formattedDate] = (dayGemsRecord[formattedDate] ?? 0) + (event.gemsReceipt?.value ?? 0);
  });

  const last14Days = Array.from({ length: 14 }, (_, i) => currentDate.minus({ days: 14 - i }).toFormat('yyyy-MM-dd'));

  return last14Days.map((day) => ({
    date: day,
    gemsCount: dayGemsRecord[day] ?? 0
  }));
}
