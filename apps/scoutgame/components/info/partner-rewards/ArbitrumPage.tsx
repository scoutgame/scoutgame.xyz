import {
  Link,
  List,
  ListItem,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography
} from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function ArbitrumPage({ infoPageImage }: { infoPageImage: string }) {
  return (
    <InfoPageContainer
      data-test='partner-rewards-arbitrum-page'
      image={infoPageImage}
      title='Scout Game × Arbitrum Developer Rewards Program'
    >
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Stack gap={3}>
        <Typography variant='h5'>Scout Game × Arbitrum Developer Rewards Program</Typography>

        <Stack gap={2}>
          <Typography variant='h6' color='secondary'>
            How It Works
          </Typography>
          <Typography>
            We have partnered with Arbitrum to gamify your open source contributions by turning pull requests into
            points, rewards, and onchain reputation. Earn 2,750 DEV for each successful PR in one of the Arbitrum
            aligned repositories on this page.
          </Typography>
        </Stack>

        <Stack gap={2}>
          <Typography variant='h6' color='secondary'>
            How to Participate
          </Typography>
          <List sx={{ listStyleType: 'disc', pl: 3 }}>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                Register as a Scout Game developer at{' '}
                <Link href='https://scoutgame.xyz' target='_blank'>
                  scoutgame.xyz
                </Link>
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>Browse our curated list of Arbitrum repositories</ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>Submit pull requests to any qualified repo</ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Earn 2,750 DEV tokens for each merged PR</strong>
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>Build your onchain reputation and climb the leaderboard</ListItemText>
            </ListItem>
          </List>
        </Stack>

        <Stack gap={2}>
          <Typography variant='h6' color='secondary'>
            Getting Started
          </Typography>
          <Typography>
            Contributing to open source can feel overwhelming at first, but every expert was once a beginner. Here's how
            to get started:
          </Typography>
          <List sx={{ listStyleType: 'decimal', pl: 3 }}>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Choose a repository</strong> from our qualified list below
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Read the contribution guide</strong> - most repos have a CONTRIBUTING.md file
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Start small</strong> - look for issues tagged as "good first issue" or "beginner"
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Fork and clone</strong> the repository to your local machine
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Understand the issue</strong> - read it carefully and ask questions if needed
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Make your changes</strong> and test them thoroughly
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Submit a PR</strong> with a clear description linking to the issue
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Be responsive</strong> - implement feedback from maintainers promptly
              </ListItemText>
            </ListItem>
          </List>
        </Stack>

        <Stack gap={2}>
          <Typography variant='h6' color='secondary'>
            Pro Tips for Success
          </Typography>
          <List sx={{ listStyleType: 'disc', pl: 3 }}>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Communication is key</strong> - Don't hesitate to ask questions in issue comments
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Quality over quantity</strong> - One well-crafted PR is better than several rushed ones
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Follow the style</strong> - Match the existing code style and conventions
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Write tests</strong> - Most projects require tests for new features
              </ListItemText>
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 0 }}>
              <ListItemText>
                <strong>Document your work</strong> - Update docs if your changes affect usage
              </ListItemText>
            </ListItem>
          </List>
        </Stack>

        <Stack gap={2}>
          <Typography variant='h6' color='secondary'>
            Qualified Arbitrum Repositories
          </Typography>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  <Link href='https://github.com/OffchainLabs/nitro' target='_blank'>
                    Arbitrum Nitro
                  </Link>
                </TableCell>
                <TableCell sx={{ border: 'none', p: 1 }}>Core L2 node software for Arbitrum One and Nova</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  <Link href='https://github.com/NethermindEth/nethermind' target='_blank'>
                    Nethermind
                  </Link>
                </TableCell>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  Alternative Ethereum execution client with Nitro support
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  <Link href='https://github.com/erigontech/erigon' target='_blank'>
                    Erigon
                  </Link>
                </TableCell>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  High-performance Ethereum execution client supporting Nitro
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  <Link href='https://github.com/OffchainLabs/arbitrum-sdk' target='_blank'>
                    Arbitrum SDK
                  </Link>
                </TableCell>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  TypeScript helper library for bridging and messaging
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  <Link href='https://github.com/pendle-finance' target='_blank'>
                    Pendle Finance
                  </Link>
                </TableCell>
                <TableCell sx={{ border: 'none', p: 1 }}>Yield-trading and fixed-rate markets protocol</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  <Link href='https://github.com/lyra-finance/v2-core' target='_blank'>
                    Lyra Finance
                  </Link>
                </TableCell>
                <TableCell sx={{ border: 'none', p: 1 }}>Options AMM protocol</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  <Link href='https://github.com/TreasureProject' target='_blank'>
                    Treasure DAO
                  </Link>
                </TableCell>
                <TableCell sx={{ border: 'none', p: 1 }}>Decentralized gaming ecosystem & NFT marketplace</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  <Link href='https://github.com/hop-protocol/hop' target='_blank'>
                    Hop Protocol
                  </Link>
                </TableCell>
                <TableCell sx={{ border: 'none', p: 1 }}>Cross-rollup token and message bridge</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  <Link href='https://github.com/across-protocol' target='_blank'>
                    Across Protocol
                  </Link>
                </TableCell>
                <TableCell sx={{ border: 'none', p: 1 }}>Optimistic bridge for fast L2 ↔ L1 transfers</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  <Link href='https://github.com/balancer/balancer-v2-monorepo' target='_blank'>
                    Balancer V2
                  </Link>
                </TableCell>
                <TableCell sx={{ border: 'none', p: 1 }}>Generalized liquidity-pool & vault architecture</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: 'none', p: 1 }}>
                  <Link href='https://github.com/EmberAGI/arbitrum-vibekit/tree/main' target='_blank'>
                    Arbitrum VibeKit
                  </Link>
                </TableCell>
                <TableCell sx={{ border: 'none', p: 1 }}>Community development toolkit</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Stack>

        <Stack gap={2}>
          <Typography variant='h6' color='secondary'>
            Start Building Today!
          </Typography>
          <Typography>
            Ready to earn rewards while contributing to Arbitrum? Checkout the Repos above and make your first PR!
          </Typography>
        </Stack>
      </Stack>
    </InfoCard>
  );
}
