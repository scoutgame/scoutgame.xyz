import { Area, AreaChart, ReferenceLine, ResponsiveContainer, YAxis } from 'recharts';

export function BuilderCardRankGraph({ last14DaysRank }: { last14DaysRank: (number | null)[] }) {
  const isAllZero = last14DaysRank.every((rank) => rank === null || rank === 0);
  const missingDays = 14 - last14DaysRank.length;
  return (
    <ResponsiveContainer width='100%' height='100%'>
      <AreaChart
        data={[
          ...(missingDays === 0
            ? last14DaysRank
            : Array.from<number, number | null>({ length: missingDays }, () => null).concat(last14DaysRank))
        ].map((rank) => ({
          value: rank ? 100 - rank : 0
        }))}
      >
        <YAxis domain={[0, 100]} hide />
        <Area isAnimationActive={false} type='monotone' dataKey='value' stroke='#69DDFF' fill='#0580A4' />
        {!isAllZero && <ReferenceLine y={50} stroke='#FF00D0' />}
      </AreaChart>
    </ResponsiveContainer>
  );
}
