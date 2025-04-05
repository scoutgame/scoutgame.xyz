'use client';

import { createContext, useContext } from 'react';

type MatchupTabContextType = (tab: string) => void;

export const MatchupTabContext = createContext<MatchupTabContextType | undefined>(undefined);

// Hook to use the context
export function useMatchupTab() {
  const context = useContext(MatchupTabContext);
  if (!context) {
    throw new Error('useMatchupTab must be used within a MatchupTabProvider');
  }
  return context;
}
