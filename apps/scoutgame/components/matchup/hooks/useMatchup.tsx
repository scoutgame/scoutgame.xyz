import { getCurrentWeek } from '@packages/dates/utils';
import type { MyMatchup } from '@packages/matchup/getMyMatchup';
import { getMyMatchup } from '@packages/matchup/getMyMatchup';
import { getNextMatchup } from '@packages/matchup/getNextMatchup';
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface MatchupContextType {
  loading: boolean;
  error: Error | null;
  currentWeek: number;
  weekNumber: number;
  myMatchup: any; // Replace with proper type when available
  nextMatchup: any; // Replace with proper type when available
  refreshMyMatchup: () => Promise<void>;
  registerForMatchup: (teamSelection: any) => Promise<void>; // Replace with proper type
  submitMatchup: (selections: any) => Promise<void>; // Replace with proper type
}

const MatchupContext = createContext<MatchupContextType | undefined>(undefined);

export function MatchupProvider({ children, myNextMatchup }: { children: ReactNode; myNextMatchup?: MyMatchup }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(() => getCurrentWeek());
  const [weekNumber, setWeekNumber] = useState<number>(initialData?.weekNumber || 0);
  const [myMatchup, setMyMatchup] = useState<any>(initialData?.myMatchup || null);
  const [nextMatchup, setNextMatchup] = useState<any>(initialData?.nextMatchup || null);

  const refreshMyMatchup = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const week = getCurrentWeek();
      setCurrentWeek(week);

      const nextMatchupData = await getNextMatchup();
      setWeekNumber(nextMatchupData.weekNumber);
      setNextMatchup(nextMatchupData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  const registerForMatchup = useCallback(
    async (teamSelection: any) => {
      try {
        setLoading(true);
        setError(null);

        // API call to register for matchup would go here
        // const response = await api.registerForMatchup(teamSelection);

        // Update local state with the response
        // setMyMatchup(response);

        // For now, just mock the response
        setMyMatchup({ ...myMatchup, registered: true, team: teamSelection });

        await refreshMyMatchup();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to register for matchup'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [myMatchup, refreshMyMatchup]
  );

  const submitMatchup = useCallback(
    async (selections: any) => {
      try {
        setLoading(true);
        setError(null);

        // API call to submit matchup selections would go here
        // const response = await api.submitMatchup(selections);

        // Update local state with the response
        // setMyMatchup(response);

        await refreshMyMatchup();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to submit matchup selections'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshMyMatchup]
  );

  const contextValue = useMemo(
    () => ({
      loading,
      error,
      currentWeek,
      weekNumber,
      myMatchup,
      nextMatchup,
      refreshMyMatchup,
      registerForMatchup,
      submitMatchup
    }),
    [
      loading,
      error,
      currentWeek,
      weekNumber,
      myMatchup,
      nextMatchup,
      refreshMyMatchup,
      registerForMatchup,
      submitMatchup
    ]
  );

  return <MatchupContext.Provider value={contextValue}>{children}</MatchupContext.Provider>;
}

export function useMatchup() {
  const context = useContext(MatchupContext);
  if (context === undefined) {
    throw new Error('useMatchup must be used within a MatchupProvider');
  }
  return context;
}
