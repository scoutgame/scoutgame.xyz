'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack, TableCell, TableRow, Typography, Collapse, IconButton } from '@mui/material';
import { useState } from 'react';

import { CommonTableRow } from 'components/developers/BuilderPageTable/components/CommonTableRow';

import { TableHeaderExplanation } from './TableHeaderExplanation';

export function CollapsibleTableHeader() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <CommonTableRow>
        <TableCell>
          <Typography sx={{ fontSize: { xs: 12, md: 16 } }}>DEVELOPER</Typography>
        </TableCell>
        <TableCell sx={{ textAlign: 'center' }}>
          <Stack>
            <Typography sx={{ fontSize: { xs: 12, md: 16 } }}>POINTS</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }} variant='caption'>
              (LAST SEASON)
            </Typography>
          </Stack>
        </TableCell>
        <TableCell sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: { xs: 12, md: 16 } }}>LEVEL</Typography>
        </TableCell>
        <TableCell sx={{ textAlign: 'center' }}>
          <Stack>
            <Typography sx={{ fontSize: { xs: 12, md: 16 } }}>WEEKLY RANK</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }} variant='caption'>
              (LAST SEASON)
            </Typography>
          </Stack>
        </TableCell>
        <TableCell sx={{ textAlign: 'right' }}>
          <IconButton onClick={() => setIsExpanded(!isExpanded)} sx={{ p: 0 }}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </TableCell>
      </CommonTableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ p: 0 }}>
          <Collapse in={isExpanded}>
            <TableHeaderExplanation />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
