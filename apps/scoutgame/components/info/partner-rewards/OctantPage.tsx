import { Typography, Table, TableBody, TableCell, TableContainer, TableRow, Link } from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function OctantPage() {
  return (
    <InfoPageContainer
      data-test='partner-octant-page'
      image='/images/info/rewards-partner-octant-base.webp'
      title='Octant'
    >
      <Document />
    </InfoPageContainer>
  );
}

const repositories = [
  { name: '0xSplits', url: 'https://github.com/0xSplits' },
  // { name: 'Abundance Protocol', url: 'https://github.com/AbundanceProtocol' },
  { name: 'Aestus', url: 'https://github.com/aestus-relay' },
  { name: 'Base / Coinbase', url: 'https://github.com/coinbase' },
  { name: 'Boring Security', url: 'https://github.com/BoringSecDAO' },
  { name: 'Citizen Wallet', url: 'https://github.com/citizenwallet' },
  { name: 'DAO Drops / PairDrops', url: 'https://github.com/dOrgTech/DAO-Drops' },
  { name: 'Ethereum', url: 'https://github.com/ethereum' },
  { name: 'Ethereum Attestation Service', url: 'https://github.com/ethereum-attestation-service' },
  { name: 'Ethereum Privacy Scaling Explorations', url: 'https://github.com/privacy-scaling-explorations' },
  // { name: 'Gitcoin', url: 'https://github.com/gitcoinco' },
  { name: 'growthepie', url: 'https://github.com/growthepie' },
  { name: 'Hypercerts', url: 'https://github.com/hypercerts-org/hypercerts' },
  { name: 'L2BEAT', url: 'https://github.com/l2beat/l2beat' },
  { name: 'MEV Relay', url: 'https://github.com/flashbots' },
  { name: 'NiceNode', url: 'https://github.com/NiceNode' }
];

const repositories2 = [
  // { name: 'Open Source Observer', url: 'https://github.com/opensource-observer' },
  { name: 'openZeppelin', url: 'https://github.com/OpenZeppelin/' },
  { name: 'Protocol Guild', url: 'https://github.com/protocolguild' },
  { name: 'Revoke.cash', url: 'https://github.com/RevokeCash/revoke.cash' },
  { name: 'Rotki', url: 'https://github.com/rotki/rotki' },
  { name: 'Shielded Voting', url: 'https://github.com/shutter-network' },
  { name: 'StateOfEth', url: 'https://github.com/etheralpha' },
  { name: 'synpress', url: 'https://github.com/Synthetixio/synpress' },
  { name: 'Tor Project', url: 'https://github.com/thetorproject' },
  { name: 'Trail of Bits', url: 'https://github.com/trailofbits' },
  { name: 'viem', url: 'https://github.com/wevm/viem' },
  { name: 'Vyper', url: 'https://github.com/vyperlang/vyper' },
  { name: 'Wagmi', url: 'https://github.com/wevm/wagmi' },
  { name: 'Web3.js', url: 'https://github.com/web3j' },
  { name: 'Web3.py', url: 'https://github.com/ethereum/web3.py' },
  { name: 'WebHash', url: 'https://github.com/WebHash-eth' }
];

function Document() {
  return (
    <InfoCard>
      <Typography>
        Scout Game is teaming up with Octant and Base to bring developers even MORE rewards! Starting Feb 3, developers
        contributing code to Octant + Base-aligned projects can earn Scout Points + USDC. The total prize pool for
        developers is 5 ETH paid out in USDC!
      </Typography>
      <Typography>
        Octant is a platform for sustainable public goods funding. With recurring funding rounds from yield generating
        strategies, it's reimagining how we fund open-source innovation. Octant is building on Base - the Ethereum L2
        where the future is being built!
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        The following GitHub repositories will be included in the Scout Game x Octant Partner Rewards.{' '}
        <strong>
          Anytime a Scout Game Developer has a pull request successfully merged to one of these repos, they will receive
          a reward of 75 USDC.
        </strong>
      </Typography>
      <Typography>
        The repository categories include projects that have previously received Octant Funding, Public Goods on Base
        and other top performing Scout Game open source repositories.
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How to contribute
      </Typography>
      <Typography>
        Always check a repository for a contribution guide. If they don't offer one, you can refer back to Scout Game's{' '}
        <Link href='/info/contribution-guide'>Open Source Contribution Guide.</Link>
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        Qualified Octant & Base Projects
      </Typography>
      <TableContainer>
        <Table>
          <TableBody>
            {repositories.map((repo, index) => (
              <TableRow key={repo.name}>
                <TableCell>
                  <Link href={repo.url} target='_blank' rel='noopener noreferrer'>
                    {repo.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {repositories2[index] && (
                    <Link href={repositories2[index].url} target='_blank' rel='noopener noreferrer'>
                      {repositories2[index].name}
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </InfoCard>
  );
}
