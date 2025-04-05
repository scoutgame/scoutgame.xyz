'use client';

import { CardActionArea, Card, Typography } from '@mui/material';

import { useMatchupTab } from './MatchupSelectionTabsContext';

export function AddDeveloperCard() {
  const setTabView = useMatchupTab();
  return (
    <Card
      variant='outlined'
      sx={{
        borderColor: 'secondary.main',
        height: '100%',
        width: '150px', // width of dev cardss
        cursor: 'pointer',
        margin: '0 auto',
        minHeight: '240px'
      }}
      onClick={() => {
        setTabView('all_cards');
      }}
    >
      <CardActionArea sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color='secondary' fontSize={60}>
          +
        </Typography>
      </CardActionArea>
    </Card>
  );
}
