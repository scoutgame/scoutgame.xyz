'use client';

import { Box } from '@mui/material';
import { StyledTabs, StyledTab } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';
import type { SyntheticEvent } from 'react';
import { useState, Suspense } from 'react';

// Tabs that have a local state in the frontend to display the correct server-side rendered tab

export function ControlledTabs<T extends string>({
  tabs,
  fallback
}: {
  tabs: { view: T; component: React.ReactNode; label: string; hidden?: boolean }[];
  fallback?: React.ReactNode;
}) {
  if (tabs.length === 0) {
    throw new Error('ControlledTabs: Tabs must have at least one tab');
  }
  const [activeTab, setActiveTab] = useState<T>(tabs[0].view);

  const handleTabChange = (event: SyntheticEvent, tab: T) => {
    setActiveTab(tab);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <StyledTabs value={activeTab} onChange={handleTabChange}>
        {tabs
          .filter((tab) => !tab.hidden)
          .map((tab) => (
            <StyledTab key={tab.view} value={tab.view} label={tab.label} />
          ))}
      </StyledTabs>

      <Box sx={{ mt: 2 }}>
        <Suspense fallback={fallback}>{tabs.find((tab) => tab.view === activeTab)?.component}</Suspense>
      </Box>
    </Box>
  );
}
