import { log } from '@charmverse/core/log';
import type { Address } from 'viem';
import { parseAbiItem } from 'viem';

import { getPublicClient } from './getPublicClient';

const BASE_CHAIN_ID = 8453;

// ETH/USDC pool on Base (0.05% fee tier)
const ETH_USDC_POOL_ADDRESS_BASE: Address = '0xd0b53D9277642d899DF5C87A3966A349A798F224';

// Token addresses on Base
const WETH_ADDRESS: Address = '0x4200000000000000000000000000000000000006';
const USDC_ADDRESS: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const uniswapV3PoolAbi = [
  parseAbiItem(
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
  ),
  parseAbiItem('function token0() external view returns (address)'),
  parseAbiItem('function token1() external view returns (address)')
];

interface TokenConfig {
  address: Address;
  decimals: number;
}

const USDC: TokenConfig = {
  address: USDC_ADDRESS,
  decimals: 6
};

const WETH: TokenConfig = {
  address: WETH_ADDRESS,
  decimals: 18
};

/**
 * Get ETH price in USD from Uniswap V3 pool on Base
 */
export async function getEthPrice(): Promise<number> {
  const publicClient = getPublicClient(BASE_CHAIN_ID);

  try {
    const [slot0Result, token0Address, token1Address] = await Promise.all([
      publicClient.readContract({
        address: ETH_USDC_POOL_ADDRESS_BASE,
        abi: uniswapV3PoolAbi,
        functionName: 'slot0'
      }),
      publicClient.readContract({
        address: ETH_USDC_POOL_ADDRESS_BASE,
        abi: uniswapV3PoolAbi,
        functionName: 'token0'
      }),
      publicClient.readContract({
        address: ETH_USDC_POOL_ADDRESS_BASE,
        abi: uniswapV3PoolAbi,
        functionName: 'token1'
      })
    ]);

    const sqrtPriceX96 = slot0Result[0];

    const isUsdcToken0 = token0Address.toLowerCase() === USDC.address.toLowerCase();
    const isWethToken0 = token0Address.toLowerCase() === WETH.address.toLowerCase();

    if (!((isUsdcToken0 && !isWethToken0) || (!isUsdcToken0 && isWethToken0))) {
      throw new Error(`Pool tokens (${token0Address}, ${token1Address}) do not match expected WETH/USDC addresses.`);
    }

    const SCALE = 36n;
    const Q96 = 2n ** 96n;
    const Q192 = Q96 * Q96;

    const sqrtPSquared = sqrtPriceX96 * sqrtPriceX96;
    const priceToken1PerToken0Scaled = (sqrtPSquared * 10n ** SCALE) / Q192;

    let ethUsdPrice: number;

    if (isUsdcToken0) {
      // token0 = USDC, token1 = WETH
      // priceToken1PerToken0 = WETH per USDC
      const wethPerUsdcScaled =
        (priceToken1PerToken0Scaled * 10n ** BigInt(USDC.decimals)) / 10n ** BigInt(WETH.decimals);

      // ETH/USD = 1 / (WETH per USDC)
      ethUsdPrice = 1 / (Number(wethPerUsdcScaled) / 10 ** Number(SCALE));
    } else {
      // token0 = WETH, token1 = USDC
      // priceToken1PerToken0 = USDC per WETH
      const usdcPerWethScaled =
        (priceToken1PerToken0Scaled * 10n ** BigInt(WETH.decimals)) / 10n ** BigInt(USDC.decimals);

      ethUsdPrice = Number(usdcPerWethScaled) / 10 ** Number(SCALE);
    }

    return ethUsdPrice;
  } catch (error) {
    log.error('Error fetching ETH price from Uniswap V3 pool', { error });
    // Fallback to a reasonable default if the pool read fails
    return 0;
  }
}
