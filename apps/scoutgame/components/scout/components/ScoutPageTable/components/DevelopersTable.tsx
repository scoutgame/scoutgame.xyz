'use client';

import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { maxDevTokenPrice } from '@packages/scoutgame/builderNfts/constants';
import type { DeveloperMetadata, DevelopersSortBy } from '@packages/scoutgame/builders/getDevelopersForTable';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { BuilderCardRankGraph } from 'components/common/Card/BuilderCard/BuilderCardActivity/BuilderCardRankGraph';
import { useGlobalModal } from 'components/common/ModalProvider';
import { TableCellText } from 'components/common/TableCellText';

import { tableRowNoPaddingSx } from './CommonTableRow';

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
  sort,
  nftType
}: {
  developers: DeveloperMetadata[];
  order: string;
  sort: DevelopersSortBy;
  nftType: 'default' | 'starter';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMdScreen = useMdScreen();
  const { openModal } = useGlobalModal();

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
            <Stack direction='row' alignItems='center' justifyContent='flex-end' lineHeight={1.5}>
              {nftType === 'starter' ? 'STARTER PRICE' : 'PRICE'}
              <SortIcon columnName='price' order={order} sort={sort} />
            </Stack>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {developers.map((developer) => {
          const cardPrice = getPrice(developer.price);
          return (
            <TableRow
              key={developer.path}
              sx={tableRowNoPaddingSx}
              onClick={() => openModal('developerInfo', { path: developer.path })}
              style={{ cursor: 'pointer' }}
            >
              <TableCell>
                <Stack
                  component={Link}
                  href={`/u/${developer.path}`}
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  alignItems='center'
                  flexDirection='row'
                  gap={{ xs: 0.75, md: 1.5 }}
                  maxWidth={{ xs: '65px', md: 'initial' }}
                >
                  <Avatar src={developer.avatar} name={developer.displayName} size={isMdScreen ? 'medium' : 'xSmall'} />
                  <Stack maxWidth={{ xs: '50px', md: 'initial' }}>
                    {developer.nftsSoldToLoggedInScout ? (
                      <Stack direction='row' alignItems='center' gap={0.5}>
                        <Typography fontSize={{ xs: '10.5px', md: '14px' }} color='green.main' noWrap>
                          {developer.nftsSoldToLoggedInScout}
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
                      {developer.displayName}
                    </TableCellText>
                  </Stack>
                </Stack>
              </TableCell>
              <TableCell align='center' sx={{ display: 'table-cell' }}>
                <TableCellText color='orange.main'>{developer.level}</TableCellText>
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
                  <BuilderCardRankGraph ranks={developer.last14DaysRank} />
                  <TableCellText
                    color='secondary'
                    minWidth={{
                      xs: 20,
                      md: 25
                    }}
                  >
                    {developer.rank || '-'}
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
                  <TableCellText deskTopfontSize='16px'>{developer.gemsCollected}</TableCellText>
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
                  <TableCellText color='text.primary'>{developer.estimatedPayout}</TableCellText>
                  {isMdScreen && <Image width={15} height={15} src='/images/dev-token-logo.png' alt='DEV Token' />}
                </Stack>
              </TableCell>
              <TableCell align='center'>
                <Stack alignItems='center' flexDirection='row' gap={{ xs: 0.5, md: 1 }} justifyContent='flex-end'>
                  <TableCellText
                    color={cardPrice === -1 ? 'grey' : 'text.primary'}
                    sx={{ fontSize: cardPrice === -1 ? '12px' : '14px' }}
                  >
                    {cardPrice === -1 ? 'SOLD OUT' : cardPrice}
                  </TableCellText>
                  {isMdScreen && cardPrice !== -1 && (
                    <Image width={15} height={15} src='/images/dev-token-logo.png' alt='DEV Token' />
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function getPrice(price: bigint) {
  const formattedPrice = Number(price || 0) / 10 ** devTokenDecimals;
  if (formattedPrice === maxDevTokenPrice) {
    return -1;
  }
  return formattedPrice;
}
