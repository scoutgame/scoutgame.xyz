import { createPublicClient, http, getContract } from 'viem';
import { base } from 'viem/chains';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';

import { getPublicClient } from '@packages/blockchain/getPublicClient';

const usdcUSDTPool = '0xD56da2B74bA826f19015E6B7Dd9Dae1903E85DA1';

// --- Implementation ---
async function getUniswapV3LiquidityWithViem() {
  // 1. Set up Viem Public Client
  const client = getPublicClient(base.id);

  const poolAddress = usdcUSDTPool as `0x${string}`;

  console.log(`Pool Address: ${poolAddress}`);

  // --- Get Liquidity using Viem ---
  try {
    // 4. Read liquidity from the pool contract
    const liquidity = await client.readContract({
      address: poolAddress,
      abi: IUniswapV3PoolABI.abi,
      functionName: 'liquidity'
    });

    console.log(`Current Pool Liquidity: ${liquidity.toString()}`);

    // 5. Read slot0 for price/tick info
    const slot0 = await client.readContract({
      address: poolAddress,
      abi: IUniswapV3PoolABI.abi,
      functionName: 'slot0'
    });

    // slot0 is returned as an array/tuple in viem: [sqrtPriceX96, tick, observationIndex, observationCardinality, observationCardinalityNext, feeProtocol, unlocked]
    const [sqrtPriceX96, tick] = slot0;

    console.log(`Current SqrtPriceX96: ${sqrtPriceX96.toString()}`);
    console.log(`Current Tick: ${tick.toString()}`);

    return liquidity;
  } catch (error) {
    console.error('Error fetching liquidity with viem:', error);
    // More specific error handling might be needed depending on viem's error types
    // Check if the error indicates the contract doesn't exist or call failed
    console.warn(`Pool ${poolAddress} might not exist or have 0 liquidity, or RPC call failed.`);
    return null;
  }
}

getUniswapV3LiquidityWithViem();
