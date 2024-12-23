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

export function mapGemReceiptsToLast7Days({
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

  const last7Days = Array.from({ length: 7 }, (_, i) => currentDate.minus({ days: 7 - i }).toFormat('yyyy-MM-dd'));

  return last7Days.map((day) => ({
    date: day,
    gemsCount: dayGemsRecord[day] ?? 0
  }));
}
