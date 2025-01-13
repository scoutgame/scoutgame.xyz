import { Area, AreaChart, ReferenceLine, ResponsiveContainer } from 'recharts';

export function BuilderCardRankGraph({ last14DaysRank }: { last14DaysRank: (number | null)[] }) {
  return (
    <ResponsiveContainer width='100%' height='100%'>
      <AreaChart
        data={last14DaysRank.map((rank) => ({
          value: rank ? 100 - rank : 0
        }))}
      >
        <Area type='monotone' dataKey='value' stroke='#69DDFF' fill='#0580A4' />
        <ReferenceLine y={50} stroke='#FF00D0' />
      </AreaChart>
    </ResponsiveContainer>
  );
}
