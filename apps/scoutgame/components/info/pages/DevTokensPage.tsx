import LaunchIcon from '@mui/icons-material/Launch';
import {
  Box,
  Divider,
  Button,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';
import { WalletAddress } from '@packages/scoutgame-ui/components/common/WalletAddress';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function DevTokensPage() {
  return (
    <InfoPageContainer
      data-test='dev-tokens-page'
      image='/images/info/info_banner.png'
      title='Scout Protocol Token (DEV)'
    >
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Stack width='fit-content' direction='row' justifyContent='space-between' gap={2}>
        <Typography fontWeight={600}>Contract Address:</Typography>
        <WalletAddress expanded address='0x047157CfFB8841A64DB93fd4E29fA3796B78466c' chainId={8453} />
      </Stack>
      <Box>
        <Button
          color='secondary'
          target='_blank'
          endIcon={<LaunchIcon />}
          href='https://app.uniswap.org/explore/tokens/base/0x047157cffb8841a64db93fd4e29fa3796b78466c'
        >
          Buy on Uniswap
        </Button>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography>
        $DEV is the native token of the Scout Protocol, a system designed to reward the people building the future and
        the ones who help surface that talent. The protocol creates a game-like environment where developers, scouts,
        and ecosystems all win together. Think of it like fantasy sports, but for open source contributions, where
        performance is directly tied to incentives.
      </Typography>
      <Typography>
        Scouts and Developers are rewarded in-game with DEV tokens. DEV tokens are claimable at the end of each week and
        remain claimable for only the current season and the next season.
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant='h4' color='secondary' mb={2}>
        Token Supply
      </Typography>
      <Typography variant='h6' color='secondary'>
        Supply and Issuance
      </Typography>
      <Typography>
        The total issuance of tokens is capped at 1,000,000,000 DEV tokens. New DEV tokens are issued weekly to reward
        triggering actions at a predetermined rate and according to the allocation schedule just ahead.
      </Typography>

      <Typography sx={{ mt: 2 }}>
        41% of all tokens (410,000,000 DEV tokens) are allocated to the community and to support gameplay. The remainder
        of the supply is allocated to the Scout Game Foundation treasury, liquidity providers, the team, and investors.
      </Typography>

      <Box px={3} py={1} display='flex' justifyContent='center'>
        <img src='/images/info/token-breakdown.png' alt='Token Breakdown' />
      </Box>

      <Table sx={{ mb: 6 }}>
        <TableHead>
          <TableRow>
            <TableCell>Summary</TableCell>
            <TableCell>Allocation (DEV tokens)</TableCell>
            <TableCell>Lockup & Vesting</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Gameplay (Community)</TableCell>
            <TableCell>200,000,000</TableCell>
            <TableCell>None</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Incentives (Community)</TableCell>
            <TableCell>210,000,000</TableCell>
            <TableCell>None</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>KOL + Marketing</TableCell>
            <TableCell>10,000,000</TableCell>
            <TableCell>None</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Team</TableCell>
            <TableCell>292,797,000</TableCell>
            <TableCell>1-year cliff + 24 monthly release periods</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Investors + Advisors</TableCell>
            <TableCell>107,203,000</TableCell>
            <TableCell>1-year cliff + 24 monthly release periods</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Exchanges + Liquidity Providers</TableCell>
            <TableCell>30,000,000</TableCell>
            <TableCell>None</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Treasury</TableCell>
            <TableCell>150,000,000</TableCell>
            <TableCell>Reserved for future use</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Typography variant='h4' color='secondary'>
        Community Incentives & Rewards
      </Typography>
      <Typography sx={{ mt: 2 }}>
        Of the 410,000,000 tokens allocated to the Scout Game community, 210,000,000 will be allocated for community
        incentives such as partnerships, airdrops, and grants programs.
      </Typography>
      <Typography sx={{ mt: 1 }}>
        The 200,000,000 DEV tokens for gameplay are allocated by season (quarterly) according to this table:
      </Typography>

      <Table
        size='small'
        sx={{
          mt: 2,
          mb: 2,
          '& .MuiTableCell-root': { textAlign: 'right' },
          '& .MuiTableHead-root .MuiTableCell-root': { textAlign: 'center', verticalAlign: 'bottom' }
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Season</TableCell>
            <TableCell>Allocation</TableCell>
            <TableCell align='center'>Gameplay %</TableCell>
            <TableCell align='center'>Total Supply %</TableCell>
            <TableCell>Season</TableCell>
            <TableCell>Allocation</TableCell>
            <TableCell>Gameplay %</TableCell>
            <TableCell>Total Supply %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
            <TableCell>1,200,000</TableCell>
            <TableCell>0.60%</TableCell>
            <TableCell>0.12%</TableCell>
            <TableCell>31</TableCell>
            <TableCell>2,885,031</TableCell>
            <TableCell>1.44%</TableCell>
            <TableCell>0.29%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>2</TableCell>
            <TableCell>1,280,444</TableCell>
            <TableCell>0.64%</TableCell>
            <TableCell>0.13%</TableCell>
            <TableCell>32</TableCell>
            <TableCell>2,975,381</TableCell>
            <TableCell>1.49%</TableCell>
            <TableCell>0.30%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>3</TableCell>
            <TableCell>1,312,597</TableCell>
            <TableCell>0.66%</TableCell>
            <TableCell>0.13%</TableCell>
            <TableCell>33</TableCell>
            <TableCell>3,069,009</TableCell>
            <TableCell>1.53%</TableCell>
            <TableCell>0.31%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>4</TableCell>
            <TableCell>1,345,916</TableCell>
            <TableCell>0.67%</TableCell>
            <TableCell>0.13%</TableCell>
            <TableCell>34</TableCell>
            <TableCell>3,166,032</TableCell>
            <TableCell>1.58%</TableCell>
            <TableCell>0.32%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>5</TableCell>
            <TableCell>1,380,444</TableCell>
            <TableCell>0.69%</TableCell>
            <TableCell>0.14%</TableCell>
            <TableCell>35</TableCell>
            <TableCell>3,266,575</TableCell>
            <TableCell>1.63%</TableCell>
            <TableCell>0.33%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>6</TableCell>
            <TableCell>1,416,224</TableCell>
            <TableCell>0.71%</TableCell>
            <TableCell>0.14%</TableCell>
            <TableCell>36</TableCell>
            <TableCell>3,370,763</TableCell>
            <TableCell>1.69%</TableCell>
            <TableCell>0.34%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>7</TableCell>
            <TableCell>1,453,302</TableCell>
            <TableCell>0.73%</TableCell>
            <TableCell>0.15%</TableCell>
            <TableCell>37</TableCell>
            <TableCell>3,478,731</TableCell>
            <TableCell>1.74%</TableCell>
            <TableCell>0.35%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>8</TableCell>
            <TableCell>1,491,724</TableCell>
            <TableCell>0.75%</TableCell>
            <TableCell>0.15%</TableCell>
            <TableCell>38</TableCell>
            <TableCell>3,590,615</TableCell>
            <TableCell>1.80%</TableCell>
            <TableCell>0.36%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>9</TableCell>
            <TableCell>1,531,540</TableCell>
            <TableCell>0.77%</TableCell>
            <TableCell>0.15%</TableCell>
            <TableCell>39</TableCell>
            <TableCell>3,706,557</TableCell>
            <TableCell>1.85%</TableCell>
            <TableCell>0.37%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>10</TableCell>
            <TableCell>1,572,801</TableCell>
            <TableCell>0.79%</TableCell>
            <TableCell>0.16%</TableCell>
            <TableCell>40</TableCell>
            <TableCell>3,826,704</TableCell>
            <TableCell>1.91%</TableCell>
            <TableCell>0.38%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>11</TableCell>
            <TableCell>1,615,557</TableCell>
            <TableCell>0.81%</TableCell>
            <TableCell>0.16%</TableCell>
            <TableCell>41</TableCell>
            <TableCell>3,951,208</TableCell>
            <TableCell>1.98%</TableCell>
            <TableCell>0.40%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>12</TableCell>
            <TableCell>1,659,865</TableCell>
            <TableCell>0.83%</TableCell>
            <TableCell>0.17%</TableCell>
            <TableCell>42</TableCell>
            <TableCell>4,080,228</TableCell>
            <TableCell>2.04%</TableCell>
            <TableCell>0.41%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>13</TableCell>
            <TableCell>1,705,779</TableCell>
            <TableCell>0.85%</TableCell>
            <TableCell>0.17%</TableCell>
            <TableCell>43</TableCell>
            <TableCell>4,213,928</TableCell>
            <TableCell>2.11%</TableCell>
            <TableCell>0.42%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>14</TableCell>
            <TableCell>1,753,359</TableCell>
            <TableCell>0.88%</TableCell>
            <TableCell>0.18%</TableCell>
            <TableCell>44</TableCell>
            <TableCell>4,352,477</TableCell>
            <TableCell>2.18%</TableCell>
            <TableCell>0.44%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>15</TableCell>
            <TableCell>1,802,665</TableCell>
            <TableCell>0.90%</TableCell>
            <TableCell>0.18%</TableCell>
            <TableCell>45</TableCell>
            <TableCell>4,496,051</TableCell>
            <TableCell>2.25%</TableCell>
            <TableCell>0.45%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>16</TableCell>
            <TableCell>1,853,758</TableCell>
            <TableCell>0.93%</TableCell>
            <TableCell>0.19%</TableCell>
            <TableCell>46</TableCell>
            <TableCell>4,644,832</TableCell>
            <TableCell>2.32%</TableCell>
            <TableCell>0.46%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>17</TableCell>
            <TableCell>1,906,705</TableCell>
            <TableCell>0.95%</TableCell>
            <TableCell>0.19%</TableCell>
            <TableCell>47</TableCell>
            <TableCell>4,799,010</TableCell>
            <TableCell>2.40%</TableCell>
            <TableCell>0.48%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>18</TableCell>
            <TableCell>1,961,573</TableCell>
            <TableCell>0.98%</TableCell>
            <TableCell>0.20%</TableCell>
            <TableCell>48</TableCell>
            <TableCell>4,958,779</TableCell>
            <TableCell>2.48%</TableCell>
            <TableCell>0.50%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>19</TableCell>
            <TableCell>2,018,430</TableCell>
            <TableCell>1.01%</TableCell>
            <TableCell>0.20%</TableCell>
            <TableCell>49</TableCell>
            <TableCell>5,124,343</TableCell>
            <TableCell>2.56%</TableCell>
            <TableCell>0.51%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>20</TableCell>
            <TableCell>2,077,349</TableCell>
            <TableCell>1.04%</TableCell>
            <TableCell>0.21%</TableCell>
            <TableCell>50</TableCell>
            <TableCell>5,295,913</TableCell>
            <TableCell>2.65%</TableCell>
            <TableCell>0.53%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>21</TableCell>
            <TableCell>2,138,406</TableCell>
            <TableCell>1.07%</TableCell>
            <TableCell>0.21%</TableCell>
            <TableCell>51</TableCell>
            <TableCell>5,473,705</TableCell>
            <TableCell>2.74%</TableCell>
            <TableCell>0.55%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>22</TableCell>
            <TableCell>2,201,677</TableCell>
            <TableCell>1.10%</TableCell>
            <TableCell>0.22%</TableCell>
            <TableCell>52</TableCell>
            <TableCell>5,657,945</TableCell>
            <TableCell>2.83%</TableCell>
            <TableCell>0.57%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>23</TableCell>
            <TableCell>2,267,242</TableCell>
            <TableCell>1.13%</TableCell>
            <TableCell>0.23%</TableCell>
            <TableCell>53</TableCell>
            <TableCell>5,848,867</TableCell>
            <TableCell>2.92%</TableCell>
            <TableCell>0.58%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>24</TableCell>
            <TableCell>2,335,186</TableCell>
            <TableCell>1.17%</TableCell>
            <TableCell>0.23%</TableCell>
            <TableCell>54</TableCell>
            <TableCell>6,046,715</TableCell>
            <TableCell>3.02%</TableCell>
            <TableCell>0.60%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>25</TableCell>
            <TableCell>2,405,594</TableCell>
            <TableCell>1.20%</TableCell>
            <TableCell>0.24%</TableCell>
            <TableCell>55</TableCell>
            <TableCell>6,251,738</TableCell>
            <TableCell>3.13%</TableCell>
            <TableCell>0.63%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>26</TableCell>
            <TableCell>2,478,556</TableCell>
            <TableCell>1.24%</TableCell>
            <TableCell>0.25%</TableCell>
            <TableCell>56</TableCell>
            <TableCell>6,464,197</TableCell>
            <TableCell>3.23%</TableCell>
            <TableCell>0.65%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>27</TableCell>
            <TableCell>2,554,164</TableCell>
            <TableCell>1.28%</TableCell>
            <TableCell>0.26%</TableCell>
            <TableCell>57</TableCell>
            <TableCell>6,684,362</TableCell>
            <TableCell>3.34%</TableCell>
            <TableCell>0.67%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>28</TableCell>
            <TableCell>2,632,514</TableCell>
            <TableCell>1.32%</TableCell>
            <TableCell>0.26%</TableCell>
            <TableCell>58</TableCell>
            <TableCell>6,912,512</TableCell>
            <TableCell>3.46%</TableCell>
            <TableCell>0.69%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>29</TableCell>
            <TableCell>2,713,706</TableCell>
            <TableCell>1.36%</TableCell>
            <TableCell>0.27%</TableCell>
            <TableCell>59</TableCell>
            <TableCell>7,148,937</TableCell>
            <TableCell>3.57%</TableCell>
            <TableCell>0.71%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>30</TableCell>
            <TableCell>2,797,843</TableCell>
            <TableCell>1.40%</TableCell>
            <TableCell>0.28%</TableCell>
            <TableCell>60</TableCell>
            <TableCell>7,393,937</TableCell>
            <TableCell>3.70%</TableCell>
            <TableCell>0.74%</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Typography sx={{ mt: 1 }}>
        All Scout Game seasons are 13 weeks long. The quarterly allocation is distributed over the 13 weeks of each
        season, proportional to the table below.
      </Typography>
      <Table size='small' sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell align='center'>Week</TableCell>
            <TableCell align='center'>Allocation %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell align='center'>1</TableCell>
            <TableCell align='center'>5%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>2</TableCell>
            <TableCell align='center'>5%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>3</TableCell>
            <TableCell align='center'>6%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>4</TableCell>
            <TableCell align='center'>6%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>5</TableCell>
            <TableCell align='center'>7%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>6</TableCell>
            <TableCell align='center'>7%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>7</TableCell>
            <TableCell align='center'>8%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>8</TableCell>
            <TableCell align='center'>8%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>9</TableCell>
            <TableCell align='center'>9%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>10</TableCell>
            <TableCell align='center'>9%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>11</TableCell>
            <TableCell align='center'>10%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>12</TableCell>
            <TableCell align='center'>10%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align='center'>13</TableCell>
            <TableCell align='center'>10%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </InfoCard>
  );
}
