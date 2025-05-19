import { Typography, Table, TableBody, TableCell, TableHead, TableRow, Link, List, ListItem } from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function DiviiPage() {
  return (
    <InfoPageContainer data-test='partner-divii-page' image='/images/info/rewards-partner-divii.png' title='Divii'>
      <InfoCard>
        <Typography variant='h6' color='secondary' fontWeight={600} mt={3} gutterBottom>
          🌍 About Divii
        </Typography>
        <Typography paragraph>
          Divii is an onchain rewards protocol that lets back-end protocols launch "pay-for-impact" campaigns. Each
          campaign tracks onchain KPIs such as TVL, transaction count, or net-new active users, then{' '}
          <strong>automatically divvies incentives</strong> to the builders whose apps create that impact. Protocols set
          the KPI. Divii handles attribution, accounting, and reward distribution.
        </Typography>
        <Typography paragraph>
          Unlike one-off grants or retroactive funding, rewards flow <strong>continuously</strong> as value is created.
          Divvi already powers live "Proof-of-Impact" campaigns on Celo and other networks, paying builders weekly for
          the transactions they generate.
        </Typography>

        <Typography variant='h6' color='secondary' fontWeight={600} mt={3} gutterBottom>
          🚀 Partner Rewards Program with Scout Game
        </Typography>
        <Table sx={{ mb: 3, maxWidth: 500 }}>
          <TableHead>
            <TableRow>
              <TableCell>Details</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Total Reward Pool</TableCell>
              <TableCell>
                <strong>$5,000 in DEV</strong>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Eligible Networks</TableCell>
              <TableCell>Base, Celo, Polygon</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Program Window</TableCell>
              <TableCell>30 days starting June 3. 2025</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Typography variant='h6' color='secondary' fontWeight={600} mt={3} gutterBottom>
          ✅ How to Participate
        </Typography>
        <List sx={{ listStyleType: 'decimal', pl: 3 }}>
          <ListItem sx={{ display: 'list-item' }}>
            <strong>Register</strong>
            <br />
            Sign up or log in at{' '}
            <Link href='https://app.divvi.xyz' target='_blank' rel='noopener'>
              app.divvi.xyz
            </Link>{' '}
            and join the "Scout Game Pilot" campaign.
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <strong>Integrate Divvi</strong>
            <br />
            Add Divvi's referral metadata to your app's first user transaction on Base, Celo, or Polygon.
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <strong>Ship and Earn</strong>
            <br />
            Keep shipping. Divvi's contracts measure your share of network-wide impact and stream DEV rewards to you
            every week.
          </ListItem>
        </List>

        <Typography variant='h6' color='secondary' fontWeight={600} mt={3} gutterBottom>
          🎯 Rewards Eligibility and Process
        </Typography>
        <Table sx={{ mb: 3, maxWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell>Impact Metric</TableCell>
              <TableCell>Measurement</TableCell>
              <TableCell>Reward Mechanism</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Transactions generated</TableCell>
              <TableCell>Counted on-chain per network</TableCell>
              <TableCell>Weekly DEV distribution via Divii, proportional to share of total impact</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Typography variant='h6' fontWeight={600} mt={3} gutterBottom>
          Resources
        </Typography>
        <List sx={{ pl: 3 }}>
          <ListItem>
            <Link href='https://app.divvi.xyz' target='_blank' rel='noopener'>
              Divvi App and Dashboard
            </Link>
          </ListItem>
          <ListItem>
            <Link href='https://docs.divvi.xyz' target='_blank' rel='noopener'>
              Divvi Docs and Integration Guide
            </Link>
          </ListItem>
        </List>

        <Typography variant='h6' color='secondary' align='left' mt={4} mb={0}>
          Scout. Build. Win. Divvi up the rewards.
        </Typography>
      </InfoCard>
    </InfoPageContainer>
  );
}
