'use client';

import type { SxProps, TabProps, TabsProps } from '@mui/material';
import { Badge, Box, Tab, Tabs, tabClasses, tabsClasses } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export type TabItem = {
  label: string;
  value: string;
  showBadge?: boolean;
};

type TabsMenuProps = {
  value: string;
  tabs: TabItem[];
  sx?: SxProps;
  queryKey?: string;
  infoIcon?: React.ReactNode;
  onChange?: (value: string) => void;
};

export function StyledTabs({ sx, ...props }: TabsProps) {
  return (
    <Tabs
      {...props}
      // allow scroll buttons on mobile
      // allowScrollButtonsMobile
      sx={{
        [`& .${tabsClasses.flexContainer}`]: {
          justifyContent: {
            xs: 'flex-start',
            sm: 'center'
          }
        },
        [`& .${tabsClasses.indicator}`]: {
          bottom: {
            xs: 8,
            md: 5
          },
          height: '1px'
        },
        [`& .${tabClasses.root}`]: {
          borderBottom: '1px solid',
          borderColor: 'var(--mui-palette-divider)'
        },
        [`& .${tabsClasses.scrollButtons}`]: {
          width: '40px',
          height: '40px'
        },
        ...sx
      }}
    />
  );
}

export function StyledTab<T extends React.ElementType>({ sx, ...props }: TabProps<T>) {
  return <Tab {...props} sx={{ fontSize: { xs: '12px', sm: '14px' } }} />;
}

export function TabsMenu({ value, tabs, sx, queryKey = 'tab', infoIcon, onChange }: TabsMenuProps) {
  const tabValue = tabs.some((t) => t.value === value) ? value : false;
  // create a memoized object of the URL query params
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  return (
    <Box sx={sx}>
      <StyledTabs
        value={tabValue}
        role='navigation'
        variant='scrollable'
        scrollButtons='auto'
        onChange={(_, newValue) => {
          onChange?.(newValue);
        }}
      >
        {tabs.map((tab) => (
          <StyledTab
            key={tab.value}
            component={Link}
            label={
              <Badge key={tab.value} color='error' variant='dot' invisible={!tab.showBadge}>
                <Box sx={{ px: 0.5 }}>{tab.label}</Box>
              </Badge>
            }
            href={{
              query: { ...params, [queryKey]: tab.value }
            }}
            value={tab.value}
            scroll={false}
            data-test={`tab-${tab.value}`}
          />
        ))}
      </StyledTabs>
      {infoIcon}
    </Box>
  );
}
