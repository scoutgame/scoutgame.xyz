'use client';

import { Card, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export function Game7Metrics({ week }: { week: string }) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['game7-metrics', week],
    queryFn: async () => {
      const res = await fetch(`/api/partners/game7/metrics?week=${week}`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    }
  });
  // Similar implementation
}
