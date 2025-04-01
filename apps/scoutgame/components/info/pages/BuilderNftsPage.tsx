import { Typography } from '@mui/material';
import { Blockquote } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/Blockquote';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function BuilderNftsPage() {
  return (
    <InfoPageContainer data-test='developer-nfts-page' image='/images/info/info_banner.png' title='Developer NFTs'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>
        Developer NFTs can be purchased with Eth, USDC, or USDT on Base, OP or Arb. Scout Points can also be used to
        purchase Developer NFTs. Developers receive 20% of the proceeds from their NFT sales in Scout Points.
      </Typography>
      <Typography>
        The price of a Developer's first NFT mint is 20 Scout Points. The price of the next NFT of the same Developer is
        calculated as follows:
      </Typography>
      <Blockquote>
        <Typography align='center' my={1}>
          <code>P = 20 x S + 20</code>
        </Typography>
        <Typography>Where:</Typography>
        <Typography>
          P: Price of the NFT (Scout Points)
          <br />
          S: Current supply (number of NFTs minted)
        </Typography>
      </Blockquote>
      <Typography>Season 1 Developer NFTs are non-transferable.</Typography>
    </InfoCard>
  );
}
