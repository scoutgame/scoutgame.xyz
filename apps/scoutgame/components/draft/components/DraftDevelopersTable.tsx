import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { getDraftDevelopers } from '@packages/scoutgame/draft/getDraftDevelopers';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import Image from 'next/image';

import { BuilderCardRankGraph } from 'components/common/Card/BuilderCard/BuilderCardActivity/BuilderCardRankGraph';
import { CommonTableRow } from 'components/developers/BuilderPageTable/components/CommonTableRow';
import { tableRowSx } from 'components/scout/components/ScoutPageTable/components/CommonTableRow';

function formatSeasonPoints(points: number) {
  if (points > 1000) {
    const k = (points / 1000).toFixed(1);
    return `${k.endsWith('.0') ? k.slice(0, -2) : k}K`;
  }
  return points;
}

export async function DraftDevelopersTable() {
  const draftDevelopers = await getDraftDevelopers();

  return (
    <Table>
      <TableHead sx={{ backgroundColor: 'background.dark', position: 'sticky', top: -10, zIndex: 1 }}>
        <CommonTableRow>
          <TableCell>DEVELOPER</TableCell>
          <TableCell sx={{ textAlign: 'center' }}>
            <Stack>
              <Typography>POINTS</Typography>
              <Typography variant='caption'>(LAST SEASON)</Typography>
            </Stack>
          </TableCell>
          <TableCell sx={{ textAlign: 'center' }}>LEVEL</TableCell>
          <TableCell sx={{ textAlign: 'center' }}>
            <Stack>
              <Typography>WEEKLY RANK</Typography>
              <Typography variant='caption'>(LAST SEASON)</Typography>
            </Stack>
          </TableCell>
          <TableCell sx={{ textAlign: 'right' }}>
            <ExpandMoreIcon />
          </TableCell>
        </CommonTableRow>
      </TableHead>
      <TableBody>
        {draftDevelopers.map((developer) => (
          <TableRow key={developer.id} sx={tableRowSx}>
            <TableCell>
              <Stack alignItems='center' flexDirection='row' gap={1} maxWidth={{ xs: '100px', md: '150px' }}>
                <Avatar src={developer.avatar} name={developer.displayName} size='medium' />
                <Typography noWrap variant='h6' fontWeight={400}>
                  {developer.displayName}
                </Typography>
              </Stack>
            </TableCell>
            <TableCell>
              <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center'>
                <Typography color='textDisabled' fontWeight={400}>
                  #{developer.rank}
                </Typography>
                <Typography variant='h6' fontWeight={400}>
                  {formatSeasonPoints(developer.seasonPoints)}
                </Typography>
                <Image src='/images/icons/binoculars.svg' alt='binoculars' width={24} height={24} />
              </Stack>
            </TableCell>
            <TableCell sx={{ textAlign: 'center' }}>
              <Stack alignItems='center' justifyContent='center'>
                <Stack
                  sx={{
                    width: {
                      xs: 32,
                      md: 40
                    },
                    height: {
                      xs: 32,
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
                      xs: 12,
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
            <TableCell sx={{ width: '150px' }}>
              <Stack alignItems='center' justifyContent='center' height='50px'>
                <BuilderCardRankGraph color='green' ranks={developer.weeklyRanks} totalRanks={15} />
              </Stack>
            </TableCell>
            <TableCell sx={{ textAlign: 'right' }}>
              <Button
                sx={{
                  px: 2,
                  py: 1,
                  width: '80px',
                  borderRadius: 1
                }}
                color='secondary'
              >
                Bid
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
