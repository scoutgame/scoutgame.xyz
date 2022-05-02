import { Box, Grid, Typography } from '@mui/material';
import { BountyStatus } from '@prisma/client';
import { PopulatedBounty } from 'charmClient';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import Button from 'components/common/Button';
import { BountiesContext } from 'hooks/useBounties';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { useContext, useMemo, useState } from 'react';
import { CSVLink } from 'react-csv';
import InputBountyStatus from './components/InputBountyStatus';
import { BountyCard } from './components/BountyCard';
import MultiPaymentModal from './components/MultiPaymentModal';
import BountyModal from './components/BountyModal';

const bountyOrder: BountyStatus[] = ['open', 'assigned', 'review', 'complete', 'paid'];

function filterBounties (bounties: PopulatedBounty[], statuses: BountyStatus[]): PopulatedBounty[] {
  return bounties?.filter(bounty => statuses.indexOf(bounty.status) > -1) ?? [];
}

function sortSelected (bountyStatuses: BountyStatus[]): BountyStatus[] {
  return bountyStatuses.sort((first, second) => {
    if (first === second) {
      return 0;
    }
    else if (bountyOrder.indexOf(first) < bountyOrder.indexOf(second)) {
      return -1;
    }
    else {
      return 1;
    }
  });
}

export default function BountyList () {
  const [displayBountyDialog, setDisplayBountyDialog] = useState(false);
  const { bounties } = useContext(BountiesContext);

  const [bountyFilter, setBountyFilter] = useState<BountyStatus[]>(['open', 'assigned', 'review']);

  const filteredBounties = filterBounties(bounties.slice(), bountyFilter);

  const sortedBounties = bounties ? sortArrayByObjectProperty(filteredBounties, 'status', bountyOrder) : [];

  const csvData = useMemo(() => {
    const completedBounties = sortedBounties.filter(bounty => bounty.status === BountyStatus.complete);
    if (!completedBounties.length) {
      return [];
    }

    // Gnosis Safe Airdrop compatible format
    // receiver: Ethereum address of transfer receiver.
    // token_address: Ethereum address of ERC20 token to be transferred.
    // amount: the amount of token to be transferred.
    // More information: https://github.com/bh2smith/safe-airdrop
    return [
      ['token_address', 'receiver', 'amount', 'chainId'],
      ...completedBounties.map((bounty, _index) => [
        bounty.rewardToken.startsWith('0x') ? bounty.rewardToken : '', // for native token it should be empty
        bounty.applications.find(application => application.createdBy === bounty.assignee)?.walletAddress,
        bounty.rewardAmount,
        bounty.chainId
      ])
    ];
  }, [sortedBounties]);

  function bountyCreated () {
    setDisplayBountyDialog(false);
  }

  return (
    <ScrollableWindow>
      <Box py={3} px='80px'>
        <Box display='flex' justifyContent='space-between' mb={3}>
          <Typography variant='h1'>Bounty list</Typography>
          <Box display='flex' justifyContent='flex-end'>
            { !!csvData.length
            && (
              <CSVLink data={csvData} filename='Gnosis Safe Airdrop.csv' style={{ textDecoration: 'none' }}>
                <Button variant='outlined'>
                  Export to CSV
                </Button>
              </CSVLink>
            )}
            <MultiPaymentModal />
            <Button
              sx={{ ml: 1 }}
              onClick={() => {
                setDisplayBountyDialog(true);
              }}
            >
              Create Bounty
            </Button>
          </Box>
        </Box>

        {/* Filters for the bounties */}
        <Box display='flex' alignContent='center' justifyContent='flex-start' mb={3}>
          <InputBountyStatus
            onChange={(statuses) => {
              setBountyFilter(sortSelected(statuses));
            }}
            renderSelectedInValue={true}
            renderSelectedInOption={true}
            defaultValues={bountyFilter}
          />
        </Box>

        <Grid container spacing={1}>
          {
            sortedBounties.length === 0
              ? <Typography paragraph={true}>No bounties were found</Typography>
              : sortedBounties.map(bounty => {
                return (
                  <Grid item>
                    <BountyCard truncate={false} key={bounty.id} bounty={bounty} />
                  </Grid>
                );
              })
          }
        </Grid>
        {
          /**
           * Remove later to its own popup modal
           */
          displayBountyDialog === true && (
            <BountyModal
              onSubmit={bountyCreated}
              open={displayBountyDialog}
              onClose={() => {
                setDisplayBountyDialog(false);
              }}
            />
          )
        }
      </Box>
    </ScrollableWindow>
  );
}
