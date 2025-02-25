'use client';

import { Card, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export function MoxieMetrics({ week }: { week: string }) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['moxie-metrics', week],
    queryFn: async () => {
      const res = await fetch(`/api/partners/moxie/metrics?week=${week}`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    }
  });
  // Similar implementation with Moxie-specific metrics
}

function MetricCard({ title, value, decimals = 0 }: { title: string; value: number; decimals?: number }) {
  return (
    <Card sx={{ p: 2, minWidth: 150 }}>
      <Typography variant='subtitle2' color='text.secondary'>
        {title}
      </Typography>
      <Typography variant='h6'>
        {value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })}
      </Typography>
    </Card>
  );
}
