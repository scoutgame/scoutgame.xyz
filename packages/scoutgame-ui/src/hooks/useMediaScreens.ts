'use client';

import type { Breakpoint, Theme } from '@mui/material';
import { useMediaQuery } from '@mui/material';

export function useLgScreen() {
  return useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
}

export function useMdScreen() {
  return useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
}

export function useSmScreen() {
  return useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));
}

export function useXsmScreen() {
  return useMediaQuery((theme: Theme) => theme.breakpoints.up('xsm' as unknown as Breakpoint));
}
