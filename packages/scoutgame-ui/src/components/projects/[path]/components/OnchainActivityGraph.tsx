'use client';

import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { Bar, Label, Legend, Tooltip, BarChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const colors = ['#69DDFF', '#0580A4'];

type Datum = {
  date: string;
} & Record<string, number | string>;

type Props = {
  data: Datum[];
};

const silver = '#AFC4E2';
const bronze = '#A05925';
const gold = '#E88E04';

function shortDate(date: string) {
  return DateTime.fromISO(date, { zone: 'utc' }).toLocaleString({ month: 'short', day: 'numeric' });
}

export function OnchainActivityGraph({ data }: Props) {
  const contractAddresses = data[0] ? Object.keys(data[0]).filter((key) => key !== 'date') : undefined;
  // Ensure we have data for the last 14 days
  const processedData = useMemo(() => {
    if (!data.length || !contractAddresses) return [];

    const dateMap = new Map(data.map((datum) => [shortDate(datum.date), datum]));
    const result: Datum[] = [];

    // Generate dates for the last 14 days
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const isoDate = shortDate(date.toISOString());

      if (dateMap.has(isoDate)) {
        result.push({ ...dateMap.get(isoDate), date: isoDate });
      } else {
        // Create empty datum for missing date
        const emptyDatum: Datum = { date: isoDate };
        contractAddresses.forEach((address) => {
          emptyDatum[address] = 0;
        });
        result.push(emptyDatum);
      }
    }

    return result;
  }, [data, contractAddresses]);
  return (
    <ResponsiveContainer width='100%' height={200}>
      <BarChart data={processedData} dataKey='date'>
        {/* <YAxis domain={[0, 100]} hide /> */}

        {/* <CartesianGrid vertical={false} strokeDasharray='3 3' /> */}
        <XAxis dataKey='date' angle={-45} textAnchor='end' style={{ fontSize: '12px' }} />
        {/* <YAxis style={{ fontSize: '12px' }} domain={[0, 2000]} /> sets the min/max range */}
        <YAxis style={{ fontSize: '12px' }} />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        {contractAddresses?.map((address, index) => (
          <Bar key={address} dataKey={address} stackId='a' fill={index % 2 === 0 ? colors[1] : colors[0]} />
        ))}
        {/* <Area isAnimationActive={false} type='monotone' dataKey='value' stroke='#69DDFF' fill='#0580A4' /> */}
        <ReferenceLine y={200} strokeDasharray='5 5' stroke={silver}>
          <Label value='Silver' fill='#111' position='left' offset={10} />
        </ReferenceLine>
        <ReferenceLine y={1800} strokeDasharray='5 5' stroke={gold} />
      </BarChart>
    </ResponsiveContainer>
  );
}
