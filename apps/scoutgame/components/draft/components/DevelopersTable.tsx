import { Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import type { DraftDeveloper } from '@packages/scoutgame/drafts/getDraftDevelopers';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { formatNumber } from '@packages/utils/strings';
import Image from 'next/image';
import { formatUnits } from 'viem';

import { BuilderCardRankGraph } from 'components/common/Card/BuilderCard/BuilderCardActivity/BuilderCardRankGraph';
import { tableRowSx } from 'components/scout/components/ScoutPageTable/components/CommonTableRow';

import { BidButton } from './BidButton';
import { CollapsibleTableHeader } from './CollapsibleTableHeader';

function formatSeasonPoints(points: number) {
  if (points > 1000) {
    const k = (points / 1000).toFixed(1);
    return `${k.endsWith('.0') ? k.slice(0, -2) : k}K`;
  }
  return points;
}

export function DevelopersTable({
  hideHeader = false,
  draftDevelopers
}: {
  hideHeader?: boolean;
  draftDevelopers: (DraftDeveloper & {
    bidAmount?: string;
  })[];
}) {
  return (
    <Table>
      {!hideHeader && (
        <TableHead sx={{ backgroundColor: 'background.dark', position: 'sticky', top: -10, zIndex: 1 }}>
          <CollapsibleTableHeader />
        </TableHead>
      )}
      <TableBody
        sx={{
          backgroundColor: 'background.paper',
          '& .MuiTableCell-root, & .MuiTableCell-body': { p: { xs: 0, md: 1 } }
        }}
      >
        {draftDevelopers.map((developer) => {
          const bidAmount = developer.bidAmount ? formatUnits(BigInt(developer.bidAmount), 18) : undefined;

          return (
            <TableRow key={developer.id} sx={tableRowSx}>
              <TableCell>
                <Stack
                  alignItems='center'
                  flexDirection='row'
                  gap={{
                    xs: 0.5,
                    md: 1
                  }}
                  maxWidth={{ xs: '75px', md: '150px' }}
                >
                  <Hidden mdDown>
                    <Avatar src={developer.avatar} name={developer.displayName} size='medium' />
                  </Hidden>
                  <Hidden mdUp>
                    <Avatar src={developer.avatar} name={developer.displayName} size='xSmall' />
                  </Hidden>
                  <Typography noWrap fontWeight={400} sx={{ fontSize: { xs: 12, md: 20 } }}>
                    {developer.displayName}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack alignItems='center' justifyContent='center'>
                  <Stack
                    flexDirection='row'
                    gap={1}
                    alignItems='center'
                    justifyContent='space-between'
                    width={{
                      xs: '60px',
                      md: '100px'
                    }}
                  >
                    <Typography color='textDisabled' sx={{ fontSize: { xs: 12, md: 16 } }} fontWeight={400}>
                      #{developer.rank}
                    </Typography>
                    <Stack
                      flexDirection='row'
                      gap={{
                        xs: 0.5,
                        md: 1
                      }}
                      alignItems='center'
                    >
                      <Typography sx={{ fontSize: { xs: 12, md: 20 } }} fontWeight={400}>
                        {formatSeasonPoints(developer.seasonPoints)}
                      </Typography>
                      <Hidden mdDown display='flex' sx={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Image src='/images/icons/binoculars.svg' alt='binoculars' width={24} height={24} />
                      </Hidden>
                      <Hidden mdUp display='flex' sx={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Image src='/images/icons/binoculars.svg' alt='binoculars' width={14} height={14} />
                      </Hidden>
                    </Stack>
                  </Stack>
                </Stack>
              </TableCell>
              <TableCell
                sx={{
                  textAlign: 'center',
                  width: {
                    xs: '75px',
                    md: '150px'
                  }
                }}
              >
                <Stack alignItems='center' justifyContent='center'>
                  <Stack
                    sx={{
                      width: {
                        xs: 28,
                        md: 40
                      },
                      height: {
                        xs: 28,
                        md: 40
                      },
                      backgroundColor: 'orange.main',
                      borderRadius: '50%',
                      border: '1.5px solid #000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography
                      fontFamily='Jura'
                      fontSize={{
                        xs: 10,
                        md: 18
                      }}
                      fontWeight='bold'
                      color='black.main'
                      lineHeight={1}
                    >
                      {developer.level}
                    </Typography>
                  </Stack>
                </Stack>
              </TableCell>
              <TableCell
                sx={{
                  width: {
                    xs: '100px',
                    md: '250px'
                  }
                }}
              >
                <Stack alignItems='center' justifyContent='center' height='50px' sx={{ py: { xs: 0.5, md: 0 } }}>
                  <BuilderCardRankGraph color='green' ranks={developer.weeklyRanks} totalRanks={15} />
                </Stack>
              </TableCell>
              <TableCell sx={{ textAlign: 'right' }}>
                {bidAmount ? (
                  <Tooltip title={`${bidAmount} DEV`}>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                      <Hidden mdDown>
                        <Typography>{formatNumber(Number(bidAmount), 4)}</Typography>
                      </Hidden>
                      <Hidden mdUp>
                        <Typography>{formatNumber(Number(bidAmount), 2)}</Typography>
                      </Hidden>
                      <Image src='/images/crypto/dev-token-logo.png' alt='dev token' width={20} height={20} />
                    </Stack>
                  </Tooltip>
                ) : (
                  <BidButton developerPath={developer.path} bidsReceived={developer.bidsReceived} />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
