'use client';

import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import type { BuilderMetadata, BuildersSortBy } from '@packages/scoutgame/builders/getBuilders';
import { getPlatform } from '@packages/utils/platform';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

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

export function BuildersTable({
  builders,
  order,
  sort
}: {
  builders: BuilderMetadata[];
  order: string;
  sort: BuildersSortBy;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMdScreen = useMdScreen();
  const { openModal } = useDeveloperInfoModal();
  const platform = getPlatform();

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
        {builders.map((builder, index) => (
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
                  {builder.nftsSoldToScout ? (
                    <Stack direction='row' alignItems='center' gap={0.5}>
                      <Typography fontSize={{ xs: '10.5px', md: '14px' }} color='green.main' noWrap>
                        {builder.nftsSoldToScout}
                      </Typography>
                      <Image
                        width={isMdScreen ? 15 : 13}
                        height={isMdScreen ? 15 : 13}
                        src='/images/profile/icons/cards-green.svg'
                        alt='green-icon'
                      />
                    </Stack>
                  ) : null}
                  <TableCellText
                    fontSize={isMdScreen ? '16px' : '10.5px'}
                    overflow='hidden'
                    textOverflow='ellipsis'
                    noWrap
                  >
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
              <Stack direction='row' alignItems='center' gap={1} height='100%'>
                <BuilderCardRankGraph last14DaysRank={builder.last14Days} />
                <TableCellText color='secondary'>{builder.rank || '-'}</TableCellText>
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
                <TableCellText fontSize={isMdScreen ? '16px' : '10.5px'}>{builder.gemsCollected}</TableCellText>
                <Image
                  width={isMdScreen ? 15 : 12.5}
                  height={isMdScreen ? 15 : 12.5}
                  src='/images/profile/icons/hex-gem-icon.svg'
                  alt='gem icon'
                />
              </Stack>
            </TableCell>
            <TableCell align='right' width={isMdScreen ? 150 : 'auto'}>
              <Stack alignItems='center' flexDirection='row' gap={{ xs: 0.5, md: 1 }} justifyContent='flex-end'>
                <TableCellText color='text.primary'>{builder.estimatedPayout}</TableCellText>
                {isMdScreen && (
                  <Image width={15} height={15} src='/images/profile/scout-game-icon.svg' alt='points icon' />
                )}
              </Stack>
            </TableCell>
            <TableCell align='center'>
              <Stack alignItems='center' flexDirection='row' gap={{ xs: 0.5, md: 1 }} justifyContent='flex-end'>
                <TableCellText color='text.primary'>
                  {/* We need to migrate $SCOUT based NFT prices to numeric column. Until then, we are storing the price as the human friendly version */}
                  {platform === 'onchain_webapp'
                    ? Number(builder.price || 0)
                    : convertCostToPoints(builder.price || BigInt(0))}
                </TableCellText>
                {isMdScreen && (
                  <Image width={15} height={15} src='/images/profile/scout-game-icon.svg' alt='points icon ' />
                )}
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
