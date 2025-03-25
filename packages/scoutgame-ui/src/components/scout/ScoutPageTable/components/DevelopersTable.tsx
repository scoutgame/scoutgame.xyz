'use client';

import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import type { DeveloperMetadata, DevelopersSortBy } from '@packages/scoutgame/builders/getDevelopersForTable';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { isOnchainPlatform } from '@packages/utils/platform';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useMdScreen } from '../../../../hooks/useMediaScreens';
import { useDeveloperInfoModal } from '../../../../providers/DeveloperInfoModalProvider';
import { Avatar } from '../../../common/Avatar';
import { BuilderCardRankGraph } from '../../../common/Card/BuilderCard/BuilderCardActivity/BuilderCardRankGraph';

import { tableRowNoPaddingSx } from './CommonTableRow';
import { TableCellText } from './TableCellText';

function SortIcon({ columnName, order, sort }: { columnName: string; order: string; sort: string }) {
  if (sort !== columnName) return null;
  return order === 'asc' ? (
    <NorthIcon color='primary' sx={{ fontSize: 14, ml: 0.15 }} />
  ) : (
    <SouthIcon color='primary' sx={{ fontSize: 14, ml: 0.15 }} />
  );
}

export function DevelopersTable({
  developers,
  order,
  sort
}: {
  developers: DeveloperMetadata[];
  order: string;
  sort: DevelopersSortBy;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMdScreen = useMdScreen();
  const { openModal } = useDeveloperInfoModal();

  const handleSort = (sortBy: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'builders');
    params.set('builderSort', sortBy);
    params.set('builderOrder', order === 'desc' || sort !== sortBy ? 'asc' : 'desc');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Table
      aria-label='Builders table'
      size='small'
      sx={{ px: { md: 10 }, backgroundColor: 'background.paper' }}
      data-test='builders-table'
    >
      <TableHead
        sx={{
          position: 'sticky',
          top: {
            xs: 20,
            md: 45
          },
          zIndex: 1000,
          backgroundColor: 'background.paper'
        }}
      >
        <TableRow sx={tableRowNoPaddingSx}>
          <TableCell align='left' sx={{ fontSize: { xs: '9px', md: 'initial' }, py: 1 }}>
            DEVELOPER
          </TableCell>
          <TableCell
            onClick={() => handleSort('level')}
            sx={{
              fontSize: { xs: '9px', md: 'initial' },
              cursor: 'pointer',
              py: 1
            }}
          >
            <Stack direction='row' alignItems='center' justifyContent='center'>
              LEVEL
              <SortIcon columnName='level' order={order} sort={sort} />
            </Stack>
          </TableCell>
          <TableCell
            sx={{
              fontSize: { xs: '9px', md: 'initial' },
              py: 1,
              lineHeight: 1.5
            }}
          >
            RANK
          </TableCell>
          <TableCell
            onClick={() => handleSort('week_gems')}
            sx={{
              fontSize: { xs: '9px', md: 'initial' },
              cursor: 'pointer',
              py: 1
            }}
          >
            <Stack direction='row' alignItems='center' justifyContent='flex-end' lineHeight={1.5}>
              WEEK'S GEMS
              <SortIcon columnName='week_gems' order={order} sort={sort} />
            </Stack>
          </TableCell>
          <TableCell
            onClick={() => handleSort('estimated_payout')}
            sx={{
              fontSize: { xs: '9px', md: 'initial' },
              cursor: 'pointer',
              py: 1
            }}
          >
            <Stack direction='row' alignItems='center' justifyContent='flex-end' lineHeight={1.5}>
              EST. PAYOUT
              <SortIcon columnName='estimated_payout' order={order} sort={sort} />
            </Stack>
          </TableCell>
          <TableCell
            onClick={() => handleSort('price')}
            sx={{
              fontSize: { xs: '9px', md: 'initial' },
              cursor: 'pointer',
              py: 1
            }}
          >
            <Stack direction='row' alignItems='center' justifyContent='flex-end'>
              PRICE
              <SortIcon columnName='price' order={order} sort={sort} />
            </Stack>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {developers.map((builder, index) => (
          <TableRow
            key={builder.path}
            sx={tableRowNoPaddingSx}
            onClick={() => openModal(builder.path)}
            style={{ cursor: 'pointer' }}
          >
            <TableCell>
              <Stack
                component={Link}
                href={`/u/${builder.path}`}
                onClick={(e) => {
                  e.preventDefault();
                }}
                alignItems='center'
                flexDirection='row'
                gap={{ xs: 0.75, md: 1.5 }}
                maxWidth={{ xs: '65px', md: 'initial' }}
              >
                <Avatar src={builder.avatar} name={builder.displayName} size={isMdScreen ? 'medium' : 'xSmall'} />
                <Stack maxWidth={{ xs: '50px', md: 'initial' }}>
                  {builder.nftsSoldToLoggedInScout ? (
                    <Stack direction='row' alignItems='center' gap={0.5}>
                      <Typography fontSize={{ xs: '10.5px', md: '14px' }} color='green.main' noWrap>
                        {builder.nftsSoldToLoggedInScout}
                      </Typography>
                      <Image
                        width={isMdScreen ? 15 : 13}
                        height={isMdScreen ? 15 : 13}
                        src='/images/profile/icons/cards-green.svg'
                        alt='green-icon'
                      />
                    </Stack>
                  ) : null}
                  <TableCellText deskTopfontSize='16px' overflow='hidden' textOverflow='ellipsis' noWrap>
                    {builder.displayName}
                  </TableCellText>
                </Stack>
              </Stack>
            </TableCell>
            <TableCell align='center' sx={{ display: 'table-cell' }}>
              <TableCellText color='orange.main'>{builder.level}</TableCellText>
            </TableCell>
            <TableCell
              padding='none'
              sx={{
                width: 150,
                height: { xs: 35, md: 50 }
              }}
            >
              <Stack
                direction='row'
                alignItems='center'
                gap={{
                  xs: 0.5,
                  md: 1
                }}
                height='100%'
              >
                <BuilderCardRankGraph last14DaysRank={builder.last14Days} />
                <TableCellText
                  color='secondary'
                  minWidth={{
                    xs: 20,
                    md: 25
                  }}
                >
                  {builder.rank || '-'}
                </TableCellText>
              </Stack>
            </TableCell>
            <TableCell align='center'>
              <Stack
                alignItems='center'
                flexDirection='row'
                gap={{ xs: 0.5, md: 1 }}
                ml={1.5}
                justifyContent='flex-end'
              >
                <TableCellText deskTopfontSize='16px'>{builder.gemsCollected}</TableCellText>
                <Image
                  width={isMdScreen ? 15 : 12.5}
                  height={isMdScreen ? 15 : 12.5}
                  src='/images/icons/gem.svg'
                  alt='gem icon'
                />
              </Stack>
            </TableCell>
            <TableCell align='right' width={isMdScreen ? 150 : 'auto'}>
              <Stack alignItems='center' flexDirection='row' gap={{ xs: 0.5, md: 1 }} justifyContent='flex-end'>
                <TableCellText color='text.primary'>{builder.estimatedPayout}</TableCellText>
                {isMdScreen && <Image width={15} height={15} src='/images/icons/binoculars.svg' alt='points icon' />}
              </Stack>
            </TableCell>
            <TableCell align='center'>
              <Stack alignItems='center' flexDirection='row' gap={{ xs: 0.5, md: 1 }} justifyContent='flex-end'>
                <TableCellText color='text.primary'>
                  {isOnchainPlatform()
                    ? Number(builder.price || 0) / 10 ** devTokenDecimals
                    : convertCostToPoints(builder.price || BigInt(0))}
                </TableCellText>
                {isMdScreen && <Image width={15} height={15} src='/images/icons/binoculars.svg' alt='points icon ' />}
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
