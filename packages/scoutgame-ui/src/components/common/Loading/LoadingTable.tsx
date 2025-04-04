/* eslint-disable react/no-array-index-key */
import type { SxProps } from '@mui/material';
import { Skeleton, Table, TableBody, TableCell, TableRow } from '@mui/material';

function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <TableRow>
      {new Array(columns).fill('').map((_, i) => (
        <TableCell key={i} component='th' scope='row'>
          <Skeleton animation='wave' width='100%' height={20} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function LoadingTable() {
  return (
    <Table aria-label='Table loading'>
      <LoadingTableBody
        sx={{
          backgroundColor: 'background.dark',
          '& .MuiTableCell-root': { padding: 1, px: 1.5, borderBottom: 'none', width: '33.33%' }
        }}
      />
    </Table>
  );
}

export function LoadingTableBody({ rows = 5, columns = 3, sx }: { rows?: number; columns?: number; sx?: SxProps }) {
  return (
    <TableBody sx={sx}>
      {new Array(rows).fill('').map((_, i) => (
        <TableRowSkeleton columns={columns} key={i} />
      ))}
    </TableBody>
  );
}
