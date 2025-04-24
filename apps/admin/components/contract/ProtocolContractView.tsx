import { Box, Divider, Grid, IconButton, Typography } from '@mui/material';
import { scoutProtocolChain } from '@packages/scoutgame/protocol/constants';
import {
  contributionSchemaDefinition,
  scoutGameUserProfileSchemaDefinition
} from '@packages/scoutgameattestations/easSchemas/index';
import Link from 'next/link';
import { MdLaunch } from 'react-icons/md';

import type { ProtocolData } from 'lib/contract/aggregateProtocolData';

function ContractLink({
  address,
  linkType = 'address',
  title,
  subtitle
}: {
  address: string;
  linkType?: 'address' | 'token' | 'contract';
  title: string;
  subtitle?: string;
}) {
  const chainName = scoutProtocolChain.name.toLowerCase();
  return (
    <Box gap={1} display='flex' flexDirection='column'>
      <Typography variant='h6'>{title}</Typography>
      <Box sx={{ minHeight: '40px' }}>{subtitle && <Typography variant='body2'>{subtitle}</Typography>}</Box>
      <Link href={`https://${chainName}.blockscout.com/${linkType}/${address}`} target='_blank'>
        {address}
        <IconButton size='small' color='primary'>
          <MdLaunch size='16px' />
        </IconButton>
      </Link>
    </Box>
  );
}

function EASSchemaLink({ schemaId, title, subtitle }: { schemaId: string; title: string; subtitle?: string }) {
  return (
    <Box gap={1} display='flex' flexDirection='column'>
      <Typography variant='h6'>{title}</Typography>
      <Box sx={{ minHeight: '40px' }}>{subtitle && <Typography variant='body2'>{subtitle}</Typography>}</Box>
      <Link href={`https://base-sepolia.easscan.org/schema/view/${schemaId}`} target='_blank'>
        {schemaId}
        <IconButton size='small' color='primary'>
          <MdLaunch size='16px' />
        </IconButton>
      </Link>
    </Box>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Typography variant='h5' fontWeight='bold'>
      {title}
    </Typography>
  );
}

function GridDivider() {
  return (
    <Grid size={12}>
      <Divider />
    </Grid>
  );
}

export function ProtocolContractView(data: ProtocolData) {
  const itemSizeTwoColumnMd = { xs: 12, md: 6 };
  const itemSizeThreeColumnMd = { xs: 12, md: 4 };

  // const { sendTransactionAsync } = useSendTransaction();

  // const { data: walletClient } = useWalletClient();

  // async function claimTokens(claimData: ProtocolData['merkleRoots'][number]) {
  //   if (!claimData.testClaim || !walletClient) {
  //     return;
  //   }

  //   const client = new ScoutProtocolImplementationClient({
  //     contractAddress: data.proxy,
  //     walletClient: walletClient as any,
  //     chain: scoutGameAttestationChain
  //   });

  //   await client.claim({
  //     args: {
  //       claimData: {
  //         week: claimData.week,
  //         amount: BigInt(claimData.testClaim.claim.amount),
  //         proofs: claimData.testClaim.proofs
  //       }
  //     }
  //   });
  // }

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <SectionTitle title='Protocol Contract Addresses' />
      </Grid>
      <Grid size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.proxy}
          title='Proxy address'
          linkType='token'
          subtitle='Long term contract for interacting with the protocol'
        />
      </Grid>
      <Grid size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.implementation}
          title='Current Implementation'
          subtitle='This contract is called by the proxy and contains the main protocol logic'
        />
      </Grid>
      <GridDivider />
      <Grid size={12}>
        <SectionTitle title='Data' />
      </Grid>
      {data.merkleRoots.map((root) => (
        <Grid size={itemSizeThreeColumnMd} key={root.week}>
          <Typography variant='h6'>Merkle Root for week {root.week}</Typography>
          {!root.root && <Typography>Week not processed</Typography>}
          {root.root &&
            (root.publishedOnchain ? (
              <Typography>Published onchain</Typography>
            ) : (
              <Typography>Awaiting publication</Typography>
            ))}

          {/* {root.testClaim && (
            <Button onClick={() => claimTokens(root)}>
              Claim {root.testClaim.claim.amount} $SCOUT with {root.testClaim.claim.address.slice(0, 5)}..
              {root.testClaim.claim.address.slice(root.testClaim.claim.address.length - 3)}
            </Button>
          )} */}
        </Grid>
      ))}
      <GridDivider />
      {/* <Grid size={12}>
        <SectionTitle title='Governance' />
      </Grid>
      <Grid size={itemSizeTwoColumnMd}>
        <Typography variant='h6'>Upgrade contract</Typography>
        <Button>Upgrade contract</Button>
      </Grid>
      <GridDivider /> */}
      <Grid size={12}>
        <SectionTitle title='Attestations' />
      </Grid>
      <Grid size={itemSizeTwoColumnMd}>
        <EASSchemaLink
          schemaId={data.easSchemas.profile}
          title={scoutGameUserProfileSchemaDefinition.name}
          subtitle='Onchain profiles for ScoutGame participants'
        />
      </Grid>
      <Grid size={itemSizeTwoColumnMd}>
        <EASSchemaLink
          schemaId={data.easSchemas.contributions}
          title={contributionSchemaDefinition.name}
          subtitle='Onchain receipts for Github Activity'
        />
      </Grid>
      <GridDivider />
      <Grid size={12}>
        <SectionTitle title='Roles & Permissions' />
      </Grid>
      <Grid size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.admin}
          title='Admin'
          subtitle='Admin wallet can upgrade the contract, update the wallet that receives proceeds from NFT sales, modify pricing, register builders and mint tokens.'
        />
      </Grid>
      <Grid size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.claimsManager}
          title='Claims Manager'
          subtitle='The wallet that can register weekly merkle roots'
        />
      </Grid>
    </Grid>
  );
}
