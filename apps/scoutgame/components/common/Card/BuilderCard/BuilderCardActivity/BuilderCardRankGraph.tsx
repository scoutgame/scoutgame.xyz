'use client';

import { Area, AreaChart, ReferenceLine, ResponsiveContainer, YAxis } from 'recharts';

const colors = {
  secondary: {
    fill: '#0580A4',
    stroke: '#69DDFF'
  },
  green: {
    fill: '#3F5E49',
    stroke: '#85FF9E'
  }
};

export function BuilderCardRankGraph({
  color = 'secondary',
  ranks,
  totalRanks = 14
}: {
  color?: 'secondary' | 'green';
  ranks: (number | null)[];
  totalRanks?: number;
}) {
  const isAllZero = ranks.every((rank) => rank === null || rank === 0);
  const missingDays = totalRanks - ranks.length;
  return (
    <ResponsiveContainer width='100%' height='100%'>
      <AreaChart
        data={[
          ...(missingDays === 0
            ? ranks
            : Array.from<number, number | null>({ length: missingDays }, () => null).concat(ranks))
        ].map((rank) => ({
          value: rank ? 100 - rank : 0
        }))}
      >
        <YAxis domain={[0, 100]} hide />
        <Area
          isAnimationActive={false}
          type='monotone'
          dataKey='value'
          stroke={colors[color].stroke}
          fill={colors[color].fill}
        />
        {!isAllZero && <ReferenceLine y={50} stroke='#FF00D0' />}
      </AreaChart>
    </ResponsiveContainer>
  );
}
