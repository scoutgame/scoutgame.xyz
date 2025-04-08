'use client';

import { Box, Typography, Paper } from '@mui/material';
import { LoadingCards } from '@packages/scoutgame-ui/components/common/Loading/LoadingCards';
import { StyledTabs, StyledTab } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import type { SyntheticEvent } from 'react';
import { useState, Suspense } from 'react';

import { MatchupTabContext } from './MatchupSelectionTabsContext';

interface MatchupSelectionGalleryProps {
  myCardsView: React.ReactNode;
  allCardsView: React.ReactNode;
}

// Create a context for the tab state

export function MatchupSelectionTabs({ myCardsView, allCardsView }: MatchupSelectionGalleryProps) {
  const [activeTab, setActiveTab] = useState<string>('my_cards');
  const { user } = useUser();

  const handleTabChange = (event: SyntheticEvent, tab: string) => {
    setActiveTab(tab);
  };

  return (
    <MatchupTabContext.Provider value={setActiveTab}>
      <Box sx={{ mt: 2 }}>
        <StyledTabs value={activeTab} onChange={handleTabChange}>
          <StyledTab value='my_cards' label='Your Deck' />
          <StyledTab value='all_cards' label='+ New Developer' />
        </StyledTabs>

        <Box sx={{ mt: 2 }}>
          <Suspense fallback={<LoadingCards count={4} />}>
            {activeTab === 'my_cards' ? (
              user ? (
                myCardsView
              ) : (
                <Paper sx={{ p: 2 }}>
                  <Typography>Please sign in to view your deck</Typography>
                </Paper>
              )
            ) : (
              allCardsView
            )}
          </Suspense>
        </Box>
      </Box>
    </MatchupTabContext.Provider>
  );
}
