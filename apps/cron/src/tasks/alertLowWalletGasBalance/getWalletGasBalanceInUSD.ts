import { getEthPrice } from '@packages/blockchain/getEthPrice';
import { POST } from '@packages/utils/http';

export async function getWalletGasBalanceInUSD(
  walletAddress: string,
  apiKey: string | undefined = process.env.ALCHEMY_API_KEY
) {
  if (!apiKey) {
    throw new Error('No Alchemy API key found');
  }
  const alchemyApiUrl = `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;

  const response = await POST<{ result: string }>(alchemyApiUrl, {
    jsonrpc: '2.0',
    method: 'eth_getBalance',
    params: [walletAddress, 'latest'],
    id: 1
  });

  if (!response.result) {
    throw new Error('Unable to fetch the balance');
  }

  const balanceWei = response.result;
  const balanceEth = parseInt(balanceWei, 16) / 10 ** 18;

  // Get ETH price from Uniswap V3 pool instead of CoinGecko
  const ethPriceInUSD = await getEthPrice();

  const balanceInUSD = balanceEth * ethPriceInUSD;

  return balanceInUSD;
}
